import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGoogleOidcStart,validateOAuthCallbackState,validateVerifiedGoogleClaims,mayLinkGoogleIdentity} from '../src/server/identity/google-oidc-preflight.ts';
import {hasPlatformPermission} from '../src/server/identity/platform-policy.ts';
const src=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('OIDC flow prepares distinct random state, nonce and PKCE challenge',()=>{
 const one=createGoogleOidcStart(),two=createGoogleOidcStart();
 assert.match(one.state,/^[A-Za-z0-9_-]{43}$/);
 assert.notEqual(one.state,one.nonce);
 assert.notEqual(one.state,two.state);
 assert.notEqual(one.verifier,one.challenge);
 assert.equal(validateOAuthCallbackState(one.state,one.state),true);
 assert.equal(validateOAuthCallbackState(one.state,two.state),false);
});
test('already-verified Google claims must match issuer, audience, nonce, times and verified email',()=>{
 const nonce=createGoogleOidcStart().nonce,now=1_800_000_000;
 const config={nonce,nowSeconds:now,clientId:'booking-id.apps.googleusercontent.com'};
 const good={iss:'https://accounts.google.com',aud:config.clientId,sub:'1234567890',email:'Test@EXAMPLE.COM',email_verified:true,nonce,iat:now-60,exp:now+600};
 assert.deepEqual(validateVerifiedGoogleClaims(good,config),{subject:good.sub,email:'test@example.com'});
 for(const fields of [{iss:'https://attacker.example'},{aud:'other'},{azp:'other'},{nonce:createGoogleOidcStart().nonce},{iat:now+200},{exp:now-1},{email_verified:false},{sub:'fake-sub'}]){
  assert.equal(validateVerifiedGoogleClaims({...good,...fields},config),null);
 }
 assert.equal(mayLinkGoogleIdentity(false,true),false);
 assert.equal(mayLinkGoogleIdentity(true,true),true);
});
test('only explicitly granted, MFA-verified platform memberships give platform authority',()=>{
 const verified={userId:'u1',role:'platform_owner',status:'active',mfaVerifiedAt:new Date('2026-10-20')};
 assert.equal(hasPlatformPermission('u1',verified,'manage_platform_roles'),true);
 assert.equal(hasPlatformPermission('u2',verified,'manage_platform_roles'),false);
 assert.equal(hasPlatformPermission('u1',{...verified,mfaVerifiedAt:null},'platform_view'),false);
 assert.equal(hasPlatformPermission('u1',{...verified,status:'suspended'},'platform_view'),false);
 assert.equal(hasPlatformPermission('u1',{...verified,role:'support'},'manage_platform_roles'),false);
 assert.doesNotMatch(src('../db/migrations/009_booking_profile_platform_authority.sql'),/GRANT .*booking_identity_service/);
 assert.match(src('../app/api/v1/auth/google/route.ts'),/authUnavailable/);
});
