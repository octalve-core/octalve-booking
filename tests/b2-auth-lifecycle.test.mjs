import test from 'node:test';
import assert from 'node:assert/strict';
import {register,resendVerification,verifyEmail,signIn,currentSession,signOut,requestPasswordReset,resetPassword} from '../src/server/identity/service.ts';

function fixture(){
 const t=new Date('2026-10-21T14:00:00Z');
 const users=new Map(),pending=new Map(),resets=new Map(),sessions=new Map(),emails=[];
 const db={
  async allowAttempt(){return true},
  async createPending({profile,passwordDigest,verification}){
   if(users.has(profile.email))return 'exists';
   const u={userId:'user-'+(users.size+1),email:profile.email,passwordDigest,verified:false,disabled:false};
   users.set(profile.email,u);
   pending.set(verification.digest,{id:u.userId,expiresAt:verification.expiresAt,used:false});
   return 'created';
  },
  async resend({email,verification}){
   const u=users.get(email);if(!u||u.verified||u.disabled)return false;
   pending.set(verification.digest,{id:u.userId,expiresAt:verification.expiresAt,used:false});return true;
  },
  async consumeVerification({digest,at}){
   const tok=pending.get(digest);
   if(!tok||tok.used||tok.expiresAt<=at)return false;
   const u=[...users.values()].find(x=>x.userId===tok.id);
   if(!u||u.disabled)return false;
   tok.used=true;u.verified=true;return true;
  },
  async getCredentials(email){return users.get(email)??null},
  async createSession({userId,digest,expiresAt}){
   const user=[...users.values()].find(u=>u.userId===userId);
   if(!user||!user.verified||user.disabled)return false;
   sessions.set(digest,{id:userId,expiresAt,revoked:false});return true;
  },
  async getSession({digest,at}){
   const s=sessions.get(digest);if(!s||s.revoked||s.expiresAt<=at)return null;
   const u=[...users.values()].find(x=>x.userId===s.id);
   return u?{userId:u.userId,verified:u.verified,disabled:u.disabled}:null;
  },
  async revokeSession({digest}){const s=sessions.get(digest);if(s)s.revoked=true},
  async beginReset({email,token}){
   const u=users.get(email);if(!u||!u.verified||u.disabled)return false;
   resets.set(token.digest,{id:u.userId,expiresAt:token.expiresAt,used:false});return true;
  },
  async completeReset({digest,passwordDigest,at}){
   const tok=resets.get(digest);if(!tok||tok.used||tok.expiresAt<=at)return false;
   const u=[...users.values()].find(x=>x.userId===tok.id);
   if(!u||u.disabled||!u.verified)return false;
   tok.used=true;u.passwordDigest=passwordDigest;
   for(const s of sessions.values())if(s.id===u.userId)s.revoked=true;
   return true;
  }
 };
 const deps={db,mailer:{async verification(email,token){emails.push({kind:'verify',email,token})},async passwordReset(email,token){emails.push({kind:'reset',email,token})}},pepper:'testing-password-pepper-with-at-least-32-bytes',now:()=>new Date(t)};
 const signup={kind:'business',fullName:'Example Person',email:'Test@EXAMPLE.COM',password:'example passphrase with 15 chars'};
 return {t,users,pending,resets,sessions,emails,deps,signup};
}
test('registration, one-use verification, and session revocation work end-to-end',async()=>{
 const x=fixture();
 assert.equal(await register(x.deps,x.signup),'accepted');
 assert.equal(x.users.size,1);
 assert.equal(x.emails.length,1);
 assert.equal((await signIn(x.deps,x.signup.email,x.signup.password)).status,'denied');
 assert.equal(await verifyEmail(x.deps,x.emails[0].token),true);
 assert.equal(await verifyEmail(x.deps,x.emails[0].token),false);
 const auth=await signIn(x.deps,x.signup.email,x.signup.password);
 assert.equal(auth.status,'authenticated');
 assert.deepEqual(await currentSession(x.deps,auth.session),{userId:'user-1'});
 await signOut(x.deps,auth.session);
 assert.equal(await currentSession(x.deps,auth.session),null);
});
test('duplicate signups do not reveal existence or send a second verification',async()=>{
 const x=fixture();
 assert.equal(await register(x.deps,x.signup),'accepted');
 assert.equal(await register(x.deps,{...x.signup,email:'test@example.com'}),'accepted');
 assert.equal(x.emails.length,1);
 assert.equal(x.users.size,1);
});
test('expired verification and unverified accounts cannot sign in',async()=>{
 const x=fixture();
 assert.equal(await register(x.deps,x.signup),'accepted');
 x.t.setTime(x.t.getTime()+25*3600000);
 assert.equal(await verifyEmail(x.deps,x.emails[0].token),false);
 assert.equal((await signIn(x.deps,x.signup.email,x.signup.password)).status,'denied');
 assert.equal(await resendVerification(x.deps,x.signup.email),'accepted');
 assert.equal(x.emails.length,2);
 assert.equal(await verifyEmail(x.deps,x.emails[1].token),true);
 x.users.get('test@example.com').disabled=true;
 assert.equal((await signIn(x.deps,x.signup.email,x.signup.password)).status,'denied');
});
test('password reset generic acknowledgement revokes all sessions and cannot be replayed',async()=>{
 const x=fixture();
 assert.equal(await requestPasswordReset(x.deps,'unknown@example.com'),'accepted');
 assert.equal(x.emails.length,0);
 await register(x.deps,x.signup);
 await verifyEmail(x.deps,x.emails[0].token);
 const a=await signIn(x.deps,x.signup.email,x.signup.password);
 const b=await signIn(x.deps,x.signup.email,x.signup.password);
 assert.equal(a.status,'authenticated');assert.equal(b.status,'authenticated');
 assert.equal(await requestPasswordReset(x.deps,x.signup.email),'accepted');
 const token=x.emails.find(x=>x.kind==='reset').token;
 assert.equal(await resetPassword(x.deps,token,'short'),false);
 assert.equal(await resetPassword(x.deps,token,'another secure passphrase 2026'),true);
 assert.equal(await resetPassword(x.deps,token,'another secure passphrase 2026'),false);
 assert.equal(await currentSession(x.deps,a.session),null);
 assert.equal(await currentSession(x.deps,b.session),null);
 assert.equal((await signIn(x.deps,x.signup.email,x.signup.password)).status,'denied');
 assert.equal((await signIn(x.deps,x.signup.email,'another secure passphrase 2026')).status,'authenticated');
});
test('malformed cross-purpose tokens never authorize a session or password change',async()=>{
 const x=fixture();
 assert.equal(await register(x.deps,{...x.signup,phoneE164:'08012345678'}),'invalid');
 await register(x.deps,x.signup);
 const verify=x.emails[0].token;
 assert.equal(await resetPassword(x.deps,verify,'secure new passphrase 2026'),false);
 assert.equal(await currentSession(x.deps,verify),null);
 assert.equal(await currentSession(x.deps,'invalid'),null);
});
