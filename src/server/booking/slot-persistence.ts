import {createHmac} from 'node:crypto';
import type {PgPool,PgConnection} from '../identity/postgres.ts';
import {requireUnambiguousUtc,validateSlotTime,type AvailabilityWindow} from './slot-time.ts';

type SessionAuthority={userId:string;workspaceId:string};
export type HoldInput={workspaceId:string;serviceId:string;staffId:string;clientId:string;localStart:string;idempotencyKey:string};
export type HoldOutcome={status:'held'|'existing';bookingId:string;claimId:string;expiresAt:Date};
type ServiceRow={duration_minutes:number;buffer_before_minutes:number;buffer_after_minutes:number;min_notice_hours:number;max_advance_days:number};
type WindowRow={start_local:string;end_local:string;is_closed?:boolean};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validIds(x:HoldInput):boolean{
 return [x.workspaceId,x.serviceId,x.staffId,x.clientId].every(v=>uuid.test(v))
  &&/^[a-zA-Z0-9_-]{16,128}$/.test(x.idempotencyKey);
}
function mapWindows(r:WindowRow[]):AvailabilityWindow[]{
 return r.filter(x=>!x.is_closed).map(x=>({start:x.start_local.slice(0,5),end:x.end_local.slice(0,5)}));
}
export async function makeStaffSlotHold(
 pool:PgPool,authorized:SessionAuthority,input:HoldInput,timezone:string,keySecret:string,now=new Date()
):Promise<HoldOutcome>{
 if(!validIds(input)||authorized.workspaceId!==input.workspaceId||!uuid.test(authorized.userId)||!keySecret||keySecret.length<32)throw Error('BOOKING_ACCESS_DENIED');
 const digest=createHmac('sha256',keySecret).update(input.workspaceId+'\0'+input.idempotencyKey).digest('hex');
 const db=await pool.connect();
 try{
  await db.query('BEGIN');
  try{
   // One database transaction and one tenant ID for EVERY query, including queries on joins.
   await db.query(`SELECT set_config('booking.workspace_id',$1,true)`,[input.workspaceId]);
   const repeat=await db.query<{id:string;claim_id:string;service_id:string;staff_id:string;client_id:string;starts_at:Date;hold_expires_at:Date|null;state:string}>(`
    SELECT b.id,c.id AS claim_id,c.service_id,c.staff_id,c.client_id,c.starts_at,c.hold_expires_at,c.state
    FROM booking_core.slot_claims c JOIN booking_core.bookings b
      ON b.claim_id=c.id AND b.workspace_id=c.workspace_id
    WHERE c.workspace_id=$1 AND c.idempotency_digest=$2 LIMIT 1
   `,[input.workspaceId,digest]);
   const matched=repeat.rows[0];
   if(matched){
    const slotTime=matched.starts_at instanceof Date?matched.starts_at:new Date(matched.starts_at);
    // Replays may not be repurposed to another client, staff, service or start.
    const requestedStart=requireUnambiguousUtc(input.localStart,timezone);
    if(matched.state!=='held'||!matched.hold_expires_at||new Date(matched.hold_expires_at)<=now)throw Error('IDEMPOTENCY_EXPIRED');
    if(matched.service_id!==input.serviceId||matched.staff_id!==input.staffId||matched.client_id!==input.clientId||slotTime.getTime()!==requestedStart.getTime())throw Error('IDEMPOTENCY_REUSE');
    await db.query('COMMIT');
    return {status:'existing',bookingId:matched.id,claimId:matched.claim_id,expiresAt:new Date(matched.hold_expires_at)};
   }
   // Expire reservations before exclusion insert; row locks serialize concurrent operations.
   await db.query(`
    WITH released AS(
      UPDATE booking_core.slot_claims SET state='released',hold_expires_at=NULL
      WHERE workspace_id=$1 AND state='held' AND hold_expires_at<=$2 RETURNING id
    )
    UPDATE booking_core.bookings b SET status='declined',updated_at=$2
    WHERE b.workspace_id=$1 AND b.claim_id IN (SELECT id FROM released) AND b.status='pending'
   `,[input.workspaceId,now]);
   const service=await db.query<ServiceRow>(`
    SELECT s.duration_minutes,s.buffer_before_minutes,s.buffer_after_minutes,
           s.min_notice_hours,s.max_advance_days
    FROM booking_core.services s JOIN booking_core.service_staff ss
       ON ss.service_id=s.id AND ss.workspace_id=s.workspace_id
    JOIN booking_core.staff f ON f.id=ss.staff_id AND f.workspace_id=s.workspace_id
    JOIN booking_core.clients c ON c.id=$4 AND c.workspace_id=s.workspace_id
    WHERE s.workspace_id=$1 AND s.id=$2 AND f.id=$3
       AND s.is_published=true AND f.is_active=true LIMIT 1
   `,[input.workspaceId,input.serviceId,input.staffId,input.clientId]);
   if(service.rows.length!==1)throw Error('SERVICE_UNAVAILABLE');
   const date=input.localStart.slice(0,10);
   const override=await db.query<WindowRow>(`
    SELECT start_local::text AS start_local,end_local::text AS end_local,is_closed
    FROM booking_core.date_overrides
    WHERE workspace_id=$1 AND staff_id=$2 AND date_local=$3
   `,[input.workspaceId,input.staffId,date]);
   let windows=override.rows;
   if(!windows.length){
    const day=new Date(date+'T00:00:00Z').getUTCDay();
    const weekly=await db.query<WindowRow>(`
      SELECT start_local::text AS start_local,end_local::text AS end_local
      FROM booking_core.weekly_hours
      WHERE workspace_id=$1 AND staff_id=$2 AND weekday=$3
    `,[input.workspaceId,input.staffId,day]);
    windows=weekly.rows;
   }
   const settings=service.rows[0];
   const slot=validateSlotTime(input.localStart,now,{
     timezone,durationMinutes:settings.duration_minutes,
     bufferBeforeMinutes:settings.buffer_before_minutes,bufferAfterMinutes:settings.buffer_after_minutes,
     minNoticeHours:settings.min_notice_hours,maxAdvanceDays:settings.max_advance_days,
     windows:mapWindows(windows),closed:windows.some(x=>x.is_closed)
   });
   const holdUntil=new Date(now.getTime()+10*60_000);
   const created=await db.query<{id:string}>(`
    INSERT INTO booking_core.slot_claims(workspace_id,service_id,staff_id,client_id,
      starts_at,ends_at,occupied_range,hold_expires_at,idempotency_digest)
    VALUES($1,$2,$3,$4,$5,$6,tstzrange($7,$8,'[)'),$9,$10) RETURNING id
   `,[input.workspaceId,input.serviceId,input.staffId,input.clientId,
     slot.startsAt,slot.endsAt,slot.occupiedFrom,slot.occupiedUntil,holdUntil,digest]);
   const claim=created.rows[0];if(!claim)throw Error('SLOT_RESERVATION_FAILED');
   const bookings=await db.query<{id:string}>(`
     INSERT INTO booking_core.bookings(workspace_id,claim_id,status)
     VALUES($1,$2,'pending') RETURNING id
   `,[input.workspaceId,claim.id]);
   const booked=bookings.rows[0];if(!booked)throw Error('BOOKING_PERSISTENCE_FAILED');
   await db.query(`
     INSERT INTO booking_core.audit_events(workspace_id,booking_id,actor_user_id,action)
     VALUES($1,$2,$3,'slot_held')
   `,[input.workspaceId,booked.id,authorized.userId]);
   await db.query('COMMIT');
   return {status:'held',bookingId:booked.id,claimId:claim.id,expiresAt:holdUntil};
  }catch(e){
   try{await db.query('ROLLBACK')}catch{}
   if(e&&typeof e==='object'&&'code' in e&&(e as {code:unknown}).code==='23P01')throw Error('SLOT_CONFLICT');
   throw e;
  }
 }finally{db.release()}
}
