import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {sealMailToken,unsealMailToken} from '../src/server/identity/mail-crypto.ts';
import {createPgIdentityRepository} from '../src/server/identity/postgres.ts';
import {dispatchAuthOutbox,expireAuthOutbox} from '../src/server/identity/mail-outbox.ts';

const key=randomBytes(32).toString('base64url');
const token=randomBytes(32).toString('base64url');
const at=new Date('2026-10-21T11:00:00.000Z');
function poolWith(handler){
 const queries=[],connections=[];
 return {queries,connections,
  async connect(){
   const item={released:false};
   connections.push(item);
   return {
    release(){item.released=true},
    async query(sql,values=[]){
     queries.push({sql,values});
     if(/^\s*(BEGIN|COMMIT|ROLLBACK)\s*$/.test(sql))return {rows:[],rowCount:null};
     return handler(sql,values,queries);
    }
   };
  }
 };
}
test('AES-256-GCM mail token can only be read with matching key, purpose and recipient',()=>{
 const ciphertext=sealMailToken(key,'verification','alice@example.com',token);
 assert.ok(ciphertext.startsWith('v1.'));
 assert.ok(!ciphertext.includes(token));
 assert.equal(unsealMailToken(key,'verification','alice@example.com',ciphertext),token);
 assert.throws(()=>unsealMailToken(key,'password-reset','alice@example.com',ciphertext));
 assert.throws(()=>unsealMailToken(key,'verification','bob@example.com',ciphertext));
 assert.throws(()=>unsealMailToken(randomBytes(32).toString('base64url'),'verification','alice@example.com',ciphertext));
 assert.throws(()=>unsealMailToken(key,'verification','alice@example.com',ciphertext.slice(0,-2)+'AA'));
});
test('shared rate limiter hashes identity, and atomically enforces the count returned by DB',async()=>{
 let attempts=0;
 const pool=poolWith((sql)=>({rows:sql.includes('RETURNING attempts')?[{attempts:++attempts}]:[],rowCount:1}));
 const identity=createPgIdentityRepository(pool,{rateKeySecret:'unit-test-throttle-secret-over-32-chars'});
 for(let i=0;i<3;i++)assert.equal(await identity.allowAttempt({event:'recover',key:'sensitive@example.com',at}),true);
 assert.equal(await identity.allowAttempt({event:'recover',key:'sensitive@example.com',at}),false);
 const query=pool.queries.find(x=>x.sql.includes('INSERT INTO booking_auth.rate_limits'));
 assert.ok(query);
 assert.match(query.sql,/ON CONFLICT \(rate_key\) DO UPDATE/);
 assert.match(query.values[0],/^[a-f0-9]{64}$/);
 assert.ok(!JSON.stringify(query).includes('sensitive@example.com'));
 assert.ok(pool.connections.every(x=>x.released));
});
test('registration inserts user, isolated workspace, pending owner, token and encrypted mail atomically',async()=>{
 const pool=poolWith(sql=>{
  if(sql.includes('INSERT INTO booking_auth.users'))return {rows:[{id:'u1'}],rowCount:1};
  if(sql.includes('INSERT INTO booking_auth.workspaces'))return {rows:[{id:'w1'}],rowCount:1};
  return {rows:[],rowCount:1};
 });
 const repo=createPgIdentityRepository(pool,{rateKeySecret:'unit-test-throttle-secret-over-32-chars'});
 const notice={kind:'verification',recipient:'alice@example.com',sealedToken:sealMailToken(key,'verification','alice@example.com',token),expiresAt:new Date(at.getTime()+86400000)};
 assert.equal(await repo.createPending({profile:{email:'alice@example.com',fullName:'Alice Example',kind:'business'},passwordDigest:'booking-scrypt-v1$placeholder',verification:{digest:'a'.repeat(64),expiresAt:notice.expiresAt},notice,at}),'created');
 const sql=pool.queries.map(x=>x.sql).join('\n');
 assert.match(sql,/BEGIN/);assert.match(sql,/COMMIT/);
 assert.match(sql,/INSERT INTO booking_auth.memberships/);
 assert.match(sql,/INSERT INTO booking_auth.mail_outbox/);
 assert.equal(pool.queries.some(x=>x.values.includes(token)),false);
});
test('failed outbox enqueue rolls back the full registration',async()=>{
 const pool=poolWith(sql=>{
  if(sql.includes('INSERT INTO booking_auth.users'))return {rows:[{id:'u1'}],rowCount:1};
  if(sql.includes('INSERT INTO booking_auth.workspaces'))return {rows:[{id:'w1'}],rowCount:1};
  if(sql.includes('INSERT INTO booking_auth.mail_outbox'))throw new Error('SIMULATED_DB_FAILURE');
  return {rows:[],rowCount:1};
 });
 const repo=createPgIdentityRepository(pool,{rateKeySecret:'unit-test-throttle-secret-over-32-chars'});
 const notice={kind:'verification',recipient:'alice@example.com',sealedToken:sealMailToken(key,'verification','alice@example.com',token),expiresAt:new Date(at.getTime()+86400000)};
 await assert.rejects(()=>repo.createPending({profile:{email:'alice@example.com',fullName:'Alice Example',kind:'business'},passwordDigest:'booking-scrypt-v1$placeholder',verification:{digest:'a'.repeat(64),expiresAt:notice.expiresAt},notice,at}),/SIMULATED_DB_FAILURE/);
 const sql=pool.queries.map(x=>x.sql.trim());
 assert.ok(sql.includes('ROLLBACK'));
 assert.ok(!sql.includes('COMMIT'));
});
test('database reset SQL consumes the one-use token, changes the password and revokes every session in transaction',async()=>{
 const pool=poolWith(sql=>{
  if(sql.includes('FROM booking_auth.one_time_tokens'))return {rows:[{id:'token1',user_id:'user1'}],rowCount:1};
  if(sql.includes('FROM booking_auth.users'))return {rows:[{id:'user1'}],rowCount:1};
  return {rows:[],rowCount:1};
 });
 const repo=createPgIdentityRepository(pool,{rateKeySecret:'unit-test-throttle-secret-over-32-chars'});
 assert.equal(await repo.completeReset({digest:'a'.repeat(64),passwordDigest:'booking-scrypt-v1$hash',at}),true);
 const sql=pool.queries.map(x=>x.sql).join('\n');
 for(const pattern of [/FOR UPDATE/,/password_digest=\$2/,/consumed_at=\$2/,/UPDATE booking_auth.sessions SET revoked_at=/])assert.match(sql,pattern);
 assert.equal(pool.queries.filter(x=>x.sql.trim()==='COMMIT').length,1);
});
test('outbox worker leases, decrypts, delivers and marks message without leaking token to SQL',async()=>{
 const sealed=sealMailToken(key,'verification','alice@example.com',token);
 let delivered=[];
 const pool=poolWith(sql=>{
  if(sql.includes('WITH candidates'))return {rows:[{id:'mail1',lease_id:'lease1',recipient:'alice@example.com',kind:'verification',sealed_token:sealed,token_expires_at:new Date(at.getTime()+3600000),attempts:1}],rowCount:1};
  return {rows:[],rowCount:1};
 });
 const result=await dispatchAuthOutbox(pool,{async deliver(message){delivered.push(message)}},{mailEncryptionKey:key,now:()=>at});
 assert.deepEqual(result,{claimed:1,delivered:1,retried:0,expired:0});
 assert.equal(delivered[0].token,token);
 assert.equal(delivered[0].idempotencyKey,'mail1');
 assert.equal(pool.queries.some(x=>x.values.includes(token)),false);
 assert.match(pool.queries.map(x=>x.sql).join('\n'),/FOR UPDATE SKIP LOCKED/);
 assert.match(pool.queries.map(x=>x.sql).join('\n'),/status='delivered'/);
});
test('expired outbox delivery never calls provider and is exhausted',async()=>{
 let sends=0;
 const pool=poolWith(sql=>{
  if(sql.includes('WITH candidates'))return {rows:[{id:'mail1',lease_id:'lease1',recipient:'alice@example.com',kind:'verification',sealed_token:'v1.invalid',token_expires_at:new Date(at.getTime()-1000),attempts:1}],rowCount:1};
  return {rows:[],rowCount:1};
 });
 const r=await dispatchAuthOutbox(pool,{async deliver(){sends++}},{mailEncryptionKey:key,now:()=>at});
 assert.equal(r.expired,1);
 assert.equal(sends,0);
 assert.equal(await expireAuthOutbox(pool,at),1);
});
test('identity migration remains private with RLS and non-public app permissions',()=>{
 for(const file of ['001_booking_auth.sql','002_booking_rate_limits.sql','003_booking_mail_outbox.sql']){
  const sql=readFileSync(new URL('../db/migrations/'+file,import.meta.url),'utf8');
  assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
  assert.match(sql,/FORCE ROW LEVEL SECURITY/);
  assert.match(sql,/REVOKE ALL/);
 }
});

test('E.164 CHECK in Booking SQL migration uses the single regex escape for a literal plus',()=>{
 const migration=readFileSync(new URL('../db/migrations/001_booking_auth.sql',import.meta.url),'utf8');
 assert.ok(migration.includes(String.raw`phone_e164 ~ '^\+[1-9][0-9]{6,14}$'`));
 assert.equal(migration.includes(String.raw`phone_e164 ~ '^\\+[1-9][0-9]{6,14}$'`),false);
});
