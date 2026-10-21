import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {Pool} from 'pg';
import {createPgIdentityRepository} from '../src/server/identity/postgres.ts';
import {register,verifyEmail,signIn,currentSession,requestPasswordReset,resetPassword} from '../src/server/identity/service.ts';
import {unsealMailToken} from '../src/server/identity/mail-crypto.ts';

// Runs only with an ephemeral PostgreSQL CI database, never customer data.
if(process.env.CI_POSTGRES_AUTH_TEST!=='1')throw Error('TEST_GUARD_REQUIRED');
const url=process.env.BOOKING_CI_POSTGRES_URL;
if(!url||!url.includes('booking_ci_identity@127.0.0.1'))throw Error('EPHEMERAL_DATABASE_ONLY');
const raw=new Pool({connectionString:url,ssl:false,max:2});
const pool={async connect(){
 const c=await raw.connect();
 return {async query(sql,params=[]){const out=await c.query(sql,params);return {rows:out.rows,rowCount:out.rowCount}},release(){c.release()}};
}};
const pepper='only-ci-password-pepper-39-characters-valid';
const rateKeySecret='only-ci-rate-key-40-characters-different';
const mailEncryptionKey=randomBytes(32).toString('base64url');
const repo=createPgIdentityRepository(pool,{rateKeySecret});
const deps={db:repo,pepper,mailEncryptionKey,now:()=>new Date()};
const email='ci-test-'+randomBytes(6).toString('hex')+'@example.invalid';
const password='Password passphrase with 2026 length';
async function outboxToken(kind){
 const r=await raw.query('SELECT sealed_token FROM booking_auth.mail_outbox WHERE recipient=$1 AND kind=$2 ORDER BY created_at DESC LIMIT 1',[email,kind]);
 assert.equal(r.rows.length,1,'Expected transactional outbox row');
 return unsealMailToken(mailEncryptionKey,kind,email,r.rows[0].sealed_token);
}
try{
 assert.equal(await register(deps,{kind:'business',fullName:'Booking Integration',email,password,timezone:'Africa/Lagos',currency:'NGN'}),'accepted');
 assert.equal(await register(deps,{kind:'business',fullName:'Booking Integration',email,password}),'accepted');
 assert.equal((await signIn(deps,email,password)).status,'denied','Unverified users must not sign in');
 const user=await raw.query('SELECT id,verified_at FROM booking_auth.users WHERE email=$1',[email]);
 assert.equal(user.rows.length,1);assert.equal(user.rows[0].verified_at,null);
 const memberships=await raw.query('SELECT role,status FROM booking_auth.memberships WHERE user_id=$1',[user.rows[0].id]);
 assert.deepEqual(memberships.rows.map(x=>({role:x.role,status:x.status})),[{role:'owner',status:'pending'}]);
 const verifyToken=await outboxToken('verification');
 assert.equal(await verifyEmail(deps,verifyToken),true);
 assert.equal(await verifyEmail(deps,verifyToken),false);
 const membershipsAfter=await raw.query('SELECT role,status FROM booking_auth.memberships WHERE user_id=$1',[user.rows[0].id]);
 assert.equal(membershipsAfter.rows[0].status,'active');
 const session=await signIn(deps,email,password);
 assert.equal(session.status,'authenticated');
 assert.deepEqual(await currentSession(deps,session.session),{userId:user.rows[0].id});
 assert.equal(await requestPasswordReset(deps,email),'accepted');
 const resetToken=await outboxToken('password-reset');
 const nextPassword='New passphrase after password reset';
 assert.equal(await resetPassword(deps,resetToken,nextPassword),true);
 assert.equal(await resetPassword(deps,resetToken,nextPassword),false);
 assert.equal(await currentSession(deps,session.session),null,'All sessions must be revoked on reset');
 assert.equal((await signIn(deps,email,password)).status,'denied');
 assert.equal((await signIn(deps,email,nextPassword)).status,'authenticated');
 const limits=await raw.query('SELECT count(*)::int AS n FROM booking_auth.rate_limits');
 assert.ok(limits.rows[0].n>=1,'Distributed rate counters should be persisted');
 console.log('PASS real PostgreSQL identity: pending registration, tenant owner, encrypted outbox, one-time verify, sessions, revocation and reset.');
}finally{await raw.end()}
