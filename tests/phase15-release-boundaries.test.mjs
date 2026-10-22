import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('Phase 15 production release remains safe without vendor connections',()=>{
 const auth=read('../src/server/identity/runtime.ts');
 assert.match(auth,/booking_core/);
 assert.match(auth,/booking_payments/);
 assert.match(auth,/platform_memberships/);
 const google=read('../app/api/v1/auth/google/route.ts');
 assert.match(google,/authUnavailable/);
 const bookings=read('../app/api/v1/bookings/route.ts');
 assert.match(bookings,/503/);
 const account=read('../app/(workspace)/account/security/page.tsx');
 assert.match(account,/\.\.\.\/api\/v1\/auth|\/api\/v1\/auth\/me/);
 assert.match(account,/Change password/);
});
