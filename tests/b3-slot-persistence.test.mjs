import test from 'node:test';
import assert from 'node:assert/strict';
import {makeStaffSlotHold} from '../src/server/booking/slot-persistence.ts';
const id=(n)=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const actor={userId:id(1),workspaceId:id(2)};
const input={workspaceId:id(2),serviceId:id(3),staffId:id(4),clientId:id(5),localStart:'2026-12-01T10:00',idempotencyKey:'idempotency-example-001'};
const now=new Date('2026-11-30T09:00:00Z'),secret='not-a-real-secret-for-testing-only-123456';
function fake({replay=null,overlap=false}={}){
 const queries=[];let released=false;
 const pool={async connect(){return {release(){released=true},async query(sql,values=[]){
  queries.push({sql,values});
  if(sql.includes('FROM booking_core.slot_claims c JOIN'))return {rows:replay?[replay]:[],rowCount:replay?1:0};
  if(sql.includes('FROM booking_core.services s JOIN'))return {rows:[{duration_minutes:30,buffer_before_minutes:10,buffer_after_minutes:15,min_notice_hours:1,max_advance_days:60}],rowCount:1};
  if(sql.includes('FROM booking_core.date_overrides'))return {rows:[],rowCount:0};
  if(sql.includes('FROM booking_core.weekly_hours'))return {rows:[{start_local:'09:00:00',end_local:'17:00:00'}],rowCount:1};
  if(sql.includes('INSERT INTO booking_core.slot_claims')){
   if(overlap)throw Object.assign(new Error('overlap'),{code:'23P01'});
   return {rows:[{id:id(6)}],rowCount:1}
  }
  if(sql.includes('INSERT INTO booking_core.bookings'))return {rows:[{id:id(7)}],rowCount:1};
  return {rows:[],rowCount:0}
 }}}};
 return {pool,queries,isReleased:()=>released};
}
test('booking hold is pending, transaction-scoped and respects staff calendar buffers',async()=>{
 const x=fake();
 const result=await makeStaffSlotHold(x.pool,actor,input,'Africa/Lagos',secret,now);
 assert.equal(result.status,'held');assert.equal(result.bookingId,id(7));
 assert.equal(x.queries[0].sql,'BEGIN');
 assert.match(x.queries[1].sql,/set_config\('booking.workspace_id',\$1,true\)/);
 const insert=x.queries.find(x=>x.sql.includes('INSERT INTO booking_core.slot_claims'));
 assert.ok(insert);
 assert.equal(insert.values[4].toISOString(),'2026-12-01T09:00:00.000Z');
 assert.equal(insert.values[6].toISOString(),'2026-12-01T08:50:00.000Z');
 assert.equal(insert.values[7].toISOString(),'2026-12-01T09:45:00.000Z');
 assert.ok(x.queries.some(x=>x.sql.includes("VALUES($1,$2,'pending')")));
 assert.equal(x.queries.at(-1).sql,'COMMIT');assert.equal(x.isReleased(),true);
});
test('cross-workspace and invalid-actor requests never touch the database',async()=>{
 const x=fake();
 await assert.rejects(makeStaffSlotHold(x.pool,{...actor,workspaceId:id(9)},input,'Africa/Lagos',secret,now),/BOOKING_ACCESS_DENIED/);
 assert.equal(x.queries.length,0);
});
test('GiST exclusion collision triggers rollback and returns slot conflict',async()=>{
 const x=fake({overlap:true});
 await assert.rejects(makeStaffSlotHold(x.pool,actor,input,'Africa/Lagos',secret,now),/SLOT_CONFLICT/);
 assert.ok(x.queries.some(x=>x.sql==='ROLLBACK'));
 assert.equal(x.queries.some(x=>x.sql==='COMMIT'),false);
});
test('expired idempotent holds cannot be replayed as active bookings',async()=>{
 const x=fake({replay:{id:id(7),claim_id:id(6),service_id:id(3),staff_id:id(4),client_id:id(5),starts_at:new Date('2026-12-01T09:00:00Z'),hold_expires_at:new Date('2026-11-29T09:00:00Z'),state:'held'}});
 await assert.rejects(makeStaffSlotHold(x.pool,actor,input,'Africa/Lagos',secret,now),/IDEMPOTENCY_EXPIRED/);
 assert.ok(x.queries.some(x=>x.sql==='ROLLBACK'));
});
