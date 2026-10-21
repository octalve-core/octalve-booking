import test from 'node:test';
import assert from 'node:assert/strict';
import {requestedFeature,validateBookingOrigin,productionCapability,missingEnv} from '../src/server/config.ts';

test('all launch switches are off without explicitly validated backend capabilities',()=>{
 const env={BOOKING_AUTH_ENABLED:'0',BOOKING_SUBMISSIONS_ENABLED:'0',BOOKING_PAYMENTS_ENABLED:'0',BOOKING_NOTIFICATIONS_ENABLED:'0'};
 for(const item of ['auth','submissions','payments','notifications'])assert.equal(requestedFeature(item,env),false);
 assert.equal(productionCapability('auth',{persistentDatabase:false,verifiedEmail:true,permissionGuard:true},{BOOKING_AUTH_ENABLED:'1'}),false);
 assert.equal(productionCapability('auth',{persistentDatabase:true,verifiedEmail:true,permissionGuard:true},{BOOKING_AUTH_ENABLED:'1'}),true);
 assert.equal(productionCapability('payments',{persistentDatabase:true,verifiedEmail:true,permissionGuard:true,providerVerified:false},{BOOKING_PAYMENTS_ENABLED:'1'}),false);
 assert.equal(productionCapability('payments',{persistentDatabase:true,verifiedEmail:true,permissionGuard:true,providerVerified:true},{BOOKING_PAYMENTS_ENABLED:'1'}),true);
});
test('origin must be canonical HTTPS and server secrets cannot be silently assumed',()=>{
 assert.equal(validateBookingOrigin('https://booking.example.com'),'https://booking.example.com');
 for(const value of ['http://booking.example.com','https://booking.example.com/','https://fake.example.com/a','https://other@example.com',''])assert.equal(validateBookingOrigin(value),null);
 assert.deepEqual(missingEnv(['DATABASE_URL','EMAIL_FROM'],{DATABASE_URL:'postgresql://fake'}),['EMAIL_FROM']);
});
