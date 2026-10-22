import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readProfilePatch,readBusinessPatch} from '../src/server/identity/service.ts';
const file=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('account updates accept validated fields only; no privilege, IDs, emails or verified flags',()=>{
 assert.deepEqual(readProfilePatch({fullName:'  Example Person  ',phoneE164:'+2348012345678'}),{fullName:'Example Person',phoneE164:'+2348012345678'});
 assert.deepEqual(readProfilePatch({phoneE164:null}),{phoneE164:null});
 assert.equal(readProfilePatch({email:'changed@example.invalid'}),null);
 assert.equal(readProfilePatch({role:'owner'}),null);
 assert.equal(readProfilePatch({phoneE164:'08012345678'}),null);
 assert.equal(readProfilePatch({}),null);
 assert.deepEqual(readBusinessPatch({website:'https://example.com',timezone:'Africa/Lagos',currency:'NGN'}),{website:'https://example.com/',timezone:'Africa/Lagos',currency:'NGN'});
 assert.equal(readBusinessPatch({website:'javascript:alert(1)'}),null);
 assert.equal(readBusinessPatch({role:'platform_owner'}),null);
 assert.equal(readBusinessPatch({timezone:'Invalid/Nope'}),null);
 assert.equal(readBusinessPatch({name:''}),null);
});
test('account routes require server session cookie, origin and separate workspace owner checks',()=>{
 const server=file('../src/server/identity/account-http.ts'),db=file('../src/server/identity/postgres.ts');
 assert.match(server,/SESSION_COOKIE/);
 assert.match(server,/trustedMutationOrigin/);
 assert.match(server,/identityRuntime/);
 assert.match(server,/result.cookies.set\(SESSION_COOKIE/);
 assert.match(db,/m.role='owner'/);
 assert.match(db,/password_digest=\$2/);
 assert.match(db,/booking_auth.sessions SET revoked_at/);
 assert.match(db,/business_identity_updated/);
});
test('platform authority storage is denied to browser and business-runtime roles',()=>{
 const sql=file('../db/migrations/009_booking_profile_platform_authority.sql');
 for(const t of ['platform_memberships','platform_audit_events']){
  assert.match(sql,new RegExp('ALTER TABLE booking_auth\\.'+t+' FORCE ROW LEVEL SECURITY'));
 }
 assert.doesNotMatch(sql,/CREATE POLICY/);
 assert.doesNotMatch(sql,/GRANT .*booking_identity_service/);
});
