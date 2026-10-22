/** CI-only, ephemeral PostgreSQL 16 acceptance. Never run against live tenant data.
 * Unlike repository/unit doubles, exercises authentic SQL and isolated runtime role. */
import assert from 'node:assert/strict';
import pg from 'pg';
import {randomBytes} from 'node:crypto';
import {createPgIdentityRepository} from '../src/server/identity/postgres.ts';
import {register,verifyEmail,resendVerification,signIn,currentSession,signOut,
 requestPasswordReset,resetPassword,getMyProfile,updateMyProfile,updateMyBusiness,changeMyPassword} from '../src/server/identity/service.ts';
import {unsealMailToken} from '../src/server/identity/mail-crypto.ts';
const {Pool}=pg;
if(process.env.BOOKING_EPHEMERAL_PG_TEST!=='yes')throw Error('EPHEMERAL_TEST_ONLY');
const pool=new Pool({host:'127.0.0.1',port:5432,database:'booking_ci',user:'booking_ci_identity',password:'booking-ci-ephemeral-test-password',ssl:false,max:3});
const wrapped={async connect(){const client=await pool.connect();return {query:async(sql,values)=>{const r=await client.query(sql,values);return {rows:r.rows,rowCount:r.rowCount}},release:()=>client.release()}}};
const key=Buffer.alloc(32,41).toString('base64url');
const now=new Date('2026-10-22T13:00:00Z');
const deps={db:createPgIdentityRepository(wrapped,{rateKeySecret:'ephemeral-CI-rate-limiter-secret-that-is-long-enough'}),pepper:'ephemeral-CI-password-pepper-that-is-long-enough',mailEncryptionKey:key,now:()=>new Date(now)};
const suffix=randomBytes(5).toString('hex');
const email='ci'+suffix+'@example.invalid',password='original very long unique passphrase 2026',next='another secure lengthy passphrase 2026';
const signup={kind:'business',fullName:'CI Booking Example',email,password,businessName:'CI Test Studio',website:'https://booking.example.invalid/',phoneE164:'+2348012345678',timezone:'Africa/Lagos',currency:'NGN'};
async function lastToken(kind){
 const r=await pool.query(`SELECT sealed_token FROM booking_auth.mail_outbox WHERE recipient=$1 AND kind=$2 ORDER BY created_at DESC,id DESC LIMIT 1`,[email,kind]);
 assert.equal(r.rowCount,1,'expected encrypted token queued');
 return unsealMailToken(key,kind,email,r.rows[0].sealed_token);
}
try{
 assert.equal(await register(deps,signup),'accepted');
 assert.equal(await register(deps,signup),'accepted','duplicate registration generic success');
 assert.equal((await signIn(deps,email,password)).status,'denied','unverified account must not log in');
 let token=await lastToken('verification');
 assert.equal(await verifyEmail(deps,token),true);
 assert.equal(await verifyEmail(deps,token),false,'replay is denied');
 const authenticated=await signIn(deps,email,password);
 assert.equal(authenticated.status,'authenticated');
 assert.ok(await currentSession(deps,authenticated.session));
 let profile=await getMyProfile(deps,authenticated.session);
 assert.equal(profile?.email,email);
 assert.equal(profile?.workspaces.length,1);
 assert.equal(profile?.workspaces[0].name,'CI Test Studio');
 assert.equal(profile?.workspaces[0].website,'https://booking.example.invalid/');
 assert.equal(await updateMyProfile(deps,authenticated.session,{fullName:'Verified Person',phoneE164:null}),'updated');
 assert.equal(await updateMyBusiness(deps,authenticated.session,profile.workspaces[0].id,{name:'Renamed Test Studio',website:null}),'updated');
 profile=await getMyProfile(deps,authenticated.session);
 assert.equal(profile?.fullName,'Verified Person');
 assert.equal(profile?.phoneE164,null);
 assert.equal(profile?.workspaces[0].name,'Renamed Test Studio');
 assert.equal(profile?.workspaces[0].website,null);
 assert.equal(await updateMyBusiness(deps,authenticated.session,'00000000-0000-4000-8000-000000000001',{name:'Attack'}),'denied');
 assert.equal(await changeMyPassword(deps,authenticated.session,'incorrect password',next),false);
 assert.equal(await changeMyPassword(deps,authenticated.session,password,next),true);
 assert.equal(await currentSession(deps,authenticated.session),null,'password change revokes sessions');
 assert.equal((await signIn(deps,email,password)).status,'denied');
 const fresh=await signIn(deps,email,next);
 assert.equal(fresh.status,'authenticated');
 assert.equal(await requestPasswordReset(deps,email),'accepted');
 const reset=await lastToken('password-reset');
 assert.equal(await resetPassword(deps,reset,'third secure lengthy passphrase 2026'),true);
 assert.equal(await resetPassword(deps,reset,'third secure lengthy passphrase 2026'),false);
 assert.equal(await currentSession(deps,fresh.session),null);
 const final=await signIn(deps,email,'third secure lengthy passphrase 2026');
 assert.equal(final.status,'authenticated');
 await signOut(deps,final.session);
 assert.equal(await currentSession(deps,final.session),null);
 console.log('PASS PostgreSQL 16: verified signup, duplicate, login, profile, ownership, password changes, reset and revocation');
}finally{await pool.end()}
