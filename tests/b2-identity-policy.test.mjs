import test from 'node:test';
import assert from 'node:assert/strict';
import {hashPassword,verifyPassword,validatePassword,issueOpaqueToken,digestOpaqueToken,equalOpaqueDigest,SESSION_COOKIE,sessionCookieOptions} from '../src/server/identity/security.ts';
import {readRegistrationInput,phoneE164,normalizedEmail} from '../src/server/identity/registration.ts';
import {hasWorkspacePermission,assertWorkspacePermission} from '../src/server/identity/policy.ts';
const pepper='unit-test-only-pepper-with-more-than-32-bytes';
test('passwords require strong length, preserve whitespace, and never hash to the same salt',async()=>{
 assert.equal(validatePassword('12345678901234'),false);
 assert.equal(validatePassword('correct horse battery staple'),true);
 const p='correct horse battery staple';
 const a=await hashPassword(p,pepper),b=await hashPassword(p,pepper);
 assert.notEqual(a,b);
 assert.equal(await verifyPassword(p,a,pepper),true);
 assert.equal(await verifyPassword('wrong correct horse',a,pepper),false);
 assert.equal(await verifyPassword(p,a,'different-pepper-abcdefghijklmnopqrstuvwxyz'),false);
 assert.equal(await verifyPassword(p,'nope',pepper),false);
 await assert.rejects(hashPassword(p,'short'),/SERVER_SECRET_NOT_CONFIGURED/);
});
test('purpose-separated opaque tokens and secure session cookie',()=>{
 const a=issueOpaqueToken('email-verification');
 assert.equal(a.digest,digestOpaqueToken('email-verification',a.token));
 assert.notEqual(a.digest,digestOpaqueToken('password-reset',a.token));
 assert.equal(equalOpaqueDigest(a.digest,a.digest),true);
 assert.equal(equalOpaqueDigest(a.digest,'0'.repeat(64)),false);
 assert.equal(SESSION_COOKIE,'__Host-octalve_booking_session');
 const opt=sessionCookieOptions();
 assert.equal(opt.httpOnly,true);assert.equal(opt.secure,true);assert.equal(opt.path,'/');assert.equal(opt.sameSite,'lax');
});
test('registration validation strips client authority and requires international phone',()=>{
 const x=readRegistrationInput({kind:'business',fullName:'  Example Person ',email:'Example@EXAMPLE.COM ',password:'example long passphrase 2026',phoneE164:'+2348012345678',role:'owner',verified:true,workspaceId:'evil'});
 assert.ok(x);assert.equal(x.email,'example@example.com');assert.equal(x.fullName,'Example Person');
 assert.equal('role' in x,false);assert.equal('verified' in x,false);assert.equal('workspaceId' in x,false);
 assert.equal(readRegistrationInput({...x,phoneE164:'08012345678'}),null);
 assert.equal(phoneE164('+2348012345678'),'+2348012345678');
 assert.equal(normalizedEmail('INVALID'),null);
});
test('server authorization checks membership and email verification',()=>{
 const identity={id:'usr-01',verified:true,disabled:false};
 const m={userId:'usr-01',workspaceId:'ws-01',role:'staff',status:'active'};
 assert.equal(hasWorkspacePermission(identity,m,'ws-01','manage_clients'),true);
 assert.equal(hasWorkspacePermission(identity,m,'ws-02','manage_clients'),false);
 assert.equal(hasWorkspacePermission(identity,{...m,role:'viewer'},'ws-01','manage_clients'),false);
 assert.equal(hasWorkspacePermission(identity,{...m,status:'suspended'},'ws-01','view'),false);
 assert.equal(hasWorkspacePermission({...identity,verified:false},m,'ws-01','view'),false);
 assert.equal(hasWorkspacePermission({...identity,disabled:true},m,'ws-01','view'),false);
 assert.throws(()=>assertWorkspacePermission(identity,m,'ws-02','view'),/WORKSPACE_ACCESS_DENIED/);
});
