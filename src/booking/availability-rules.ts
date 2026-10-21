import type {HourWindow, WeeklyHours, AvailabilitySettings} from './types';

export function validateWindows(windows:HourWindow[]):string|null {
  const sorted=[...windows].sort((a,b)=>a.start.localeCompare(b.start));
  for(let i=0;i<sorted.length;i++){
    const window=sorted[i];
    if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(window.start)||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(window.end)||window.start>=window.end) return 'Every time window needs a valid start before its end.';
    if(i>0&&sorted[i-1].end>window.start) return 'Time windows cannot overlap.';
  }
  return null;
}
export function validateAvailability(hours:WeeklyHours,settings:AvailabilitySettings):string|null {
  if(!['Africa/Lagos','Europe/London','America/New_York','UTC'].includes(settings.timezone))return 'Choose a supported preview timezone.';
  if(![settings.bufferBefore,settings.bufferAfter,settings.minNoticeHours,settings.maxAdvanceDays].every(Number.isInteger))return 'Scheduling safeguards must be whole numbers.';
  if(settings.bufferBefore<0||settings.bufferAfter<0||settings.bufferBefore>240||settings.bufferAfter>240)return 'Buffers must be between 0 and 240 minutes.';
  if(settings.minNoticeHours<0||settings.minNoticeHours>720)return 'Minimum notice must be between 0 and 720 hours.';
  if(settings.maxAdvanceDays<1||settings.maxAdvanceDays>365)return 'Advance booking must be between 1 and 365 days.';
  for(const windows of Object.values(hours)){const error=validateWindows(windows);if(error)return error;}
  const seen=new Set<string>();
  for(const override of settings.overrides){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(override.date)||Number.isNaN(Date.parse(override.date+'T00:00:00Z'))||new Date(override.date+'T00:00:00Z').toISOString().slice(0,10)!==override.date)return 'Every date exception must use a valid calendar date.';
    if(seen.has(override.date))return 'Only one override is allowed per date.';
    seen.add(override.date);
    if(!override.closed){const error=validateWindows(override.windows);if(error)return error;if(!override.windows.length)return 'A custom date needs at least one time window.';}
  }
  return null;
}
