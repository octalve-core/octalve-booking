export type BookingStatus = 'Confirmed' | 'Awaiting bank review' | 'Awaiting payment' | 'Cancelled';
export type EnquiryStatus = 'New' | 'Reviewing' | 'Qualified' | 'Declined';
export type PaymentMethod = 'Free' | 'Gateway' | 'Merchant bank';
export type MeetingFormat = 'In person' | 'Google Meet' | 'Zoom' | 'Microsoft Teams';
export interface Service { id:string; title:string; minutes:number; price:number; deposit:number; format:MeetingFormat; description:string; active:boolean; policy?:PaymentPolicy; bufferBefore?:number; bufferAfter?:number; minNoticeHours?:number; maxAdvanceDays?:number; intakeQuestions?:IntakeQuestion[]; }
export interface Client { id:string; name:string; email:string; phone:string; notes:string; stage:'New'|'Follow up'|'Active'; }
export interface Booking { id:string; clientId:string; serviceId:string; date:string; time:string; status:BookingStatus; method:PaymentMethod; note:string; }
export interface Enquiry { id:string; clientId:string; subject:string; brief:string; status:EnquiryStatus; notes:string; }
export interface HourWindow {start:string;end:string}
export type WeeklyHours = Record<number, HourWindow[]>;
export interface DateOverride { id:string; date:string; closed:boolean; windows:HourWindow[]; note:string; }
export interface AvailabilitySettings { timezone:string; bufferBefore:number; bufferAfter:number; minNoticeHours:number; maxAdvanceDays:number; overrides:DateOverride[]; }
export interface IntakeQuestion { id:string; label:string; help:string; kind:'Short answer'|'Long answer'|'Single choice'|'Checkbox'; required:boolean; }
export type PaymentPolicy = 'Free'|'Deposit'|'Full prepayment'|'Pay later';
export interface AppRecordState { bookings:Booking[]; clients:Client[]; enquiries:Enquiry[]; services:Service[]; hours:WeeklyHours; availability:AvailabilitySettings; }
export const BOOKING_STATUSES: BookingStatus[]=['Confirmed','Awaiting bank review','Awaiting payment','Cancelled'];
export interface ConfirmationEvidence { method:PaymentMethod; slotFree:boolean; holdLive:boolean; providerVerified?:boolean; bankVerified?:boolean; merchantApproved?:boolean; }
/** Client claims, checkout redirects and screenshots do not establish settlement. */
export function bookingCanConfirm(proof:ConfirmationEvidence):boolean {
 if(!proof.slotFree||!proof.holdLive)return false;
 if(proof.method==='Free')return true;
 if(proof.method==='Gateway')return proof.providerVerified===true;
 return proof.bankVerified===true && proof.merchantApproved===true;
}
export function money(amount:number):string { return amount===0?'Free':new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(amount); }
export function textDate(date:string):string { const [year,month,day]=date.split('-').map(Number);return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(new Date(year,month-1,day)); }
