import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');
test('B2 schema is isolated with foreign keys and deny-by-default RLS',()=>{
 const sql=read('../db/migrations/001_booking_auth.sql');
 for(const table of ['users','workspaces','memberships','sessions','one_time_tokens','oauth_identities','invitations','auth_events']){
  assert.match(sql,new RegExp('booking_auth\\.'+table));
  assert.match(sql,new RegExp('ALTER TABLE booking_auth\\.'+table+' ENABLE ROW LEVEL SECURITY'));
 }
 assert.match(sql,/token_digest char\(64\)/);
 assert.match(sql,/UNIQUE\(provider,user_id\)/);
 assert.doesNotMatch(sql,/octalve[_-](?:invoice|emr)|finance|patients/i);
});
test('B2 routes are guarded by server-side configuration and retain explicit disabled Google flow',()=>{
 const shared=read('../src/server/identity/unavailable.ts');
 const runtime=read('../src/server/identity/runtime.ts');
 const http=read('../src/server/identity/http.ts');
 assert.match(shared,/status:503/);
 assert.match(shared,/no-store/);
 assert.match(runtime,/requestedFeature\('auth'\)/);
 assert.match(runtime,/rolbypassrls AS bypassrls/);
 assert.match(runtime,/policy_count/);
 assert.match(http,/identityRuntime\(\)\.catch/);
 assert.match(http,/trustedMutationOrigin/);
 assert.match(http,/authUnavailable/);
 for(const route of ['register','login','forgot-password','reset-password','verify-email','resend-verification','logout']){
  const r=read('../app/api/v1/auth/'+route+'/route.ts');
  assert.match(r,/authenticatedOperation/);
  assert.doesNotMatch(r,/cookies\(\)\.set|success:true/);
 }
 assert.match(read('../app/api/v1/auth/google/route.ts'),/authUnavailable/);
});

test('B2 workspace page remains separate from demo and public booking authority',()=>{
 assert.match(read('../src/server/identity/policy.ts'),/WORKSPACE_ACCESS_DENIED/);
 assert.match(read('../src/server/identity/security.ts'),/timingSafeEqual/);
 assert.match(read('../app/api/v1/bookings/route.ts'),/503/);
});
