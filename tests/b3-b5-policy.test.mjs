import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {requireUnambiguousUtc,validateSlotTime} from '../src/server/booking/slot-time.ts';
import {verifyPaystackWebhook,verifyFlutterwaveV3,verifyFlutterwaveV4,canSettleIntent} from '../src/server/payments/verification.ts';
import {validateImportMetadata,escapeSpreadsheetCell} from '../src/server/integrations/import-policy.ts';

test('Nigeria local booking time converts deterministically to UTC and applies buffer guards',()=>{
 const settings={timezone:'Africa/Lagos',durationMinutes:30,bufferBeforeMinutes:10,bufferAfterMinutes:15,minNoticeHours:12,maxAdvanceDays:365,windows:[{start:'09:00',end:'17:00'}]};
 const slot=validateSlotTime('2026-12-01T10:00',new Date('2026-11-30T10:00:00Z'),settings);
 assert.equal(slot.startsAt.toISOString(),'2026-12-01T09:00:00.000Z');
 assert.equal(slot.occupiedFrom.toISOString(),'2026-12-01T08:50:00.000Z');
 assert.equal(slot.occupiedUntil.toISOString(),'2026-12-01T09:45:00.000Z');
 assert.throws(()=>validateSlotTime('2026-12-01T18:00',new Date('2026-11-30T10:00Z'),settings),/OUTSIDE_WORKING_HOURS/);
 assert.throws(()=>validateSlotTime('2026-12-01T10:00',new Date('2026-12-01T08:00Z'),settings),/NOTICE_TOO_SHORT/);
});
test('US daylight-saving ambiguous and nonexistent local times fail closed',()=>{
 assert.throws(()=>requireUnambiguousUtc('2026-03-08T02:30','America/New_York'),/NONEXISTENT_LOCAL_TIME/);
 assert.throws(()=>requireUnambiguousUtc('2026-11-01T01:30','America/New_York'),/AMBIGUOUS_LOCAL_TIME/);
 assert.equal(requireUnambiguousUtc('2026-10-01T10:00','America/New_York').toISOString(),'2026-10-01T14:00:00.000Z');
});
test('Paystack webhook uses full raw-body HMAC-SHA512',()=>{
 const secret='demo-test-only-secret-string',body=Buffer.from('{"event":"charge.success"}');
 const digest=createHmac('sha512',secret).update(body).digest('hex');
 assert.equal(verifyPaystackWebhook(body,digest,secret),true);
 assert.equal(verifyPaystackWebhook(Buffer.from('changed'),digest,secret),false);
 assert.equal(verifyPaystackWebhook(body,digest.slice(0,-2),secret),false);
});
test('Flutterwave versions must use exact configured signature algorithm',()=>{
 const secret='demo-test-only-secret-string',body=Buffer.from('{"event":"charge.completed"}');
 const signature=createHmac('sha256',secret).update(body).digest('base64');
 assert.equal(verifyFlutterwaveV4(body,signature,secret),true);
 assert.equal(verifyFlutterwaveV4(body,'different',secret),false);
 assert.equal(verifyFlutterwaveV3(secret,secret),true);
 assert.equal(verifyFlutterwaveV3('other',secret),false);
});
test('webhook acknowledgement is not payment truth; provider-checked reference amount and currency are mandatory',()=>{
 const expected={reference:'inv_abc',currency:'NGN',amountMinor:2500000};
 const checked={provider:'paystack',providerChecked:true,reference:'inv_abc',currency:'NGN',amountMinor:2500000,status:'success'};
 assert.equal(canSettleIntent(expected,checked),true);
 for(const change of [{providerChecked:false},{amountMinor:2500001},{currency:'USD'},{reference:'fake'},{status:'pending'}])
  assert.equal(canSettleIntent(expected,{...checked,...change}),false);
});
test('imports reject unknown file extensions, oversized data and Excel formula injection',()=>{
 assert.equal(validateImportMetadata('bookings.csv',1024,'calendly_csv'),true);
 assert.equal(validateImportMetadata('data.exe',1024,'calendly_csv'),false);
 assert.equal(validateImportMetadata('schedule.ics',1024,'ics'),true);
 assert.equal(validateImportMetadata('sample.csv',5*1024*1024+1,'cal_com_csv'),false);
 assert.equal(escapeSpreadsheetCell('=HYPERLINK("evil")'),\x22'=HYPERLINK("evil")\x22);
 assert.equal(escapeSpreadsheetCell('Normal appointment'),'Normal appointment');
});
