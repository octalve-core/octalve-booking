/** Booking server-only time policy. No browser slot enumeration may grant a hold.
 * Ambiguous or nonexistent DST wall-clock times are rejected rather than guessed. */
export interface AvailabilityWindow {start:string;end:string}
export interface SlotSettings {
 timezone:string;durationMinutes:number;bufferBeforeMinutes:number;bufferAfterMinutes:number;
 minNoticeHours:number;maxAdvanceDays:number;
 windows:AvailabilityWindow[];closed?:boolean
}
export type SlotResult={startsAt:Date;endsAt:Date;occupiedFrom:Date;occupiedUntil:Date};
const HHMM=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
function parseWall(input:string){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input))throw Error('INVALID_LOCAL_DATETIME');
 const date=input.slice(0,10),hour=input.slice(11);
 if(!HHMM.test(hour)||new Date(date+'T00:00:00.000Z').toISOString().slice(0,10)!==date)throw Error('INVALID_LOCAL_DATETIME');
 return {date,hour,naiveUtc:Date.parse(input+':00.000Z')};
}
function zonedParts(date:Date,timezone:string):string{
 const f=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const parts=Object.fromEntries(f.formatToParts(date).map(x=>[x.type,x.value]));
 return parts.year+'-'+parts.month+'-'+parts.day+'T'+parts.hour+':'+parts.minute;
}
/** Test likely UTC offsets to find matching instants, including DST folds. */
export function requireUnambiguousUtc(local:string,timezone:string):Date{
 const p=parseWall(local);
 const matches=new Set<number>();
 // UTC offsets span -12 to +14 hours; half and 45-minute zones included.
 for(let offset=-14*60;offset<=14*60;offset+=15){
  const candidate=p.naiveUtc-offset*60000;
  if(zonedParts(new Date(candidate),timezone)===local)matches.add(candidate);
 }
 if(matches.size!==1)throw Error(matches.size===0?'NONEXISTENT_LOCAL_TIME':'AMBIGUOUS_LOCAL_TIME');
 return new Date([...matches][0]);
}
const minute=(v:string)=>{if(!HHMM.test(v))throw Error('INVALID_HOUR_WINDOW');return Number(v.slice(0,2))*60+Number(v.slice(3))};
export function validateSlotTime(startLocal:string,now:Date,settings:SlotSettings):SlotResult{
 const p=parseWall(startLocal);
 if(!Number.isFinite(now.getTime()))throw Error('INVALID_CLOCK');
 const {durationMinutes,bufferBeforeMinutes,bufferAfterMinutes,minNoticeHours,maxAdvanceDays}=settings;
 for(const n of [durationMinutes,bufferBeforeMinutes,bufferAfterMinutes,minNoticeHours,maxAdvanceDays])if(!Number.isInteger(n))throw Error('INVALID_SLOT_POLICY');
 if(durationMinutes<5||durationMinutes>720||bufferBeforeMinutes<0||bufferBeforeMinutes>240||bufferAfterMinutes<0||bufferAfterMinutes>240||minNoticeHours<0||minNoticeHours>720||maxAdvanceDays<1||maxAdvanceDays>365)throw Error('INVALID_SLOT_POLICY');
 if(settings.closed)throw Error('DAY_CLOSED');
 const starting=minute(p.hour),ending=starting+durationMinutes;
 if(ending>1440)throw Error('OUTSIDE_WORKING_HOURS');
 if(!settings.windows.some(w=>{const a=minute(w.start),b=minute(w.end);return a<=starting&&b>=ending&&a<b;}))throw Error('OUTSIDE_WORKING_HOURS');
 const startsAt=requireUnambiguousUtc(startLocal,settings.timezone);
 const endsAt=new Date(startsAt.getTime()+durationMinutes*60000);
 // DST may change mid-appointment: reject inconsistent local ending rather than silently shifting wall time.
 const localEnd=zonedParts(endsAt,settings.timezone);
 const endDay=new Date(p.naiveUtc+durationMinutes*60000).toISOString().slice(0,16);
 if(localEnd!==endDay)throw Error('DST_BOUNDARY_IN_SLOT');
 const elapsed=startsAt.getTime()-now.getTime();
 if(elapsed<minNoticeHours*3600000)throw Error('NOTICE_TOO_SHORT');
 if(elapsed>maxAdvanceDays*86400000)throw Error('DATE_TOO_FAR');
 return {startsAt,endsAt,occupiedFrom:new Date(startsAt.getTime()-bufferBeforeMinutes*60000),occupiedUntil:new Date(endsAt.getTime()+bufferAfterMinutes*60000)};
}
