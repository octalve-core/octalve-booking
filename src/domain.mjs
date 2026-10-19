/** Shared booking-state vocabulary for the independent server implementation. */
export const BOOKING_STATUS=Object.freeze({HOLD_FREE:'HELD_FREE',HOLD_GATEWAY:'HELD_GATEWAY',AWAITING_APPROVAL:'AWAITING_APPROVAL',AWAITING_BANK_REVIEW:'AWAITING_BANK_REVIEW',CONFIRMED:'CONFIRMED',EXPIRED:'EXPIRED',CANCELLED:'CANCELLED',COMPLETED:'COMPLETED',NO_SHOW:'NO_SHOW',PAYMENT_EXCEPTION:'PAYMENT_EXCEPTION'});
export function paymentRequiredNow({priceMinor,upfrontPercent=100}){
 if(!Number.isSafeInteger(priceMinor)||priceMinor<0)throw new RangeError('Price must be a nonnegative integer in minor units');
 if(!Number.isInteger(upfrontPercent)||upfrontPercent<0||upfrontPercent>100)throw new RangeError('Upfront percentage must be 0 to 100');
 return Math.ceil(priceMinor*upfrontPercent/100);
}
export function initialBookingState({priceMinor,paymentMethod,upfrontPercent=100}){
 const due=paymentRequiredNow({priceMinor,upfrontPercent});
 if(priceMinor===0)return {status:BOOKING_STATUS.HOLD_FREE,requiredNow:0,authority:'availability-engine'};
 if(due===0)return {status:BOOKING_STATUS.AWAITING_APPROVAL,requiredNow:0,authority:'merchant_pay_later_approval'};
 if(paymentMethod==='merchant_bank')return {status:BOOKING_STATUS.AWAITING_BANK_REVIEW,requiredNow:due,authority:'merchant_verified_evidence'};
 if(['paystack','flutterwave','monnify','gateway'].includes(paymentMethod))return {status:BOOKING_STATUS.HOLD_GATEWAY,requiredNow:due,authority:'provider_verified_payment'};
 throw new Error('Unsupported payment method');
}
export function canConfirm({state,paymentMethod,providerVerified=false,bankVerified=false,slotFree=false,reviewHoldLive=false,merchantApproved=false,holdLive=false}){
 if(!slotFree)return false;
 if(state===BOOKING_STATUS.HOLD_FREE)return paymentMethod==='free'&&holdLive;
 if(state===BOOKING_STATUS.HOLD_GATEWAY)return providerVerified&&['paystack','flutterwave','monnify','gateway'].includes(paymentMethod);
 if(state===BOOKING_STATUS.AWAITING_APPROVAL)return paymentMethod==='pay_later'&&merchantApproved&&reviewHoldLive;
 if(state===BOOKING_STATUS.AWAITING_BANK_REVIEW)return paymentMethod==='merchant_bank'&&bankVerified&&reviewHoldLive;
 return false;
}
export function bookingIntervalsOverlap({start:a,end:b},{start:c,end:d}){
 for(const v of [a,b,c,d])if(!Number.isFinite(v))throw new TypeError('Numeric UTC millisecond timestamps required');
 if(b<=a||d<=c)throw new RangeError('Intervals must have positive duration');
 return a<d && c<b;
}
export function validateBookingPrice(priceMinor){if(!Number.isSafeInteger(priceMinor)||priceMinor<0)throw new RangeError('Invalid minor-unit price');return {free:priceMinor===0,priceMinor};}
export function safeDisplayStatus(status){return ({HELD_FREE:'Availability check',HELD_GATEWAY:'Awaiting payment',AWAITING_APPROVAL:'Awaiting approval',AWAITING_BANK_REVIEW:'Awaiting payment review',CONFIRMED:'Confirmed',EXPIRED:'Expired',CANCELLED:'Cancelled',COMPLETED:'Completed',NO_SHOW:'No-show',PAYMENT_EXCEPTION:'Payment review required'})[status]||'Unknown';}
export function assertNoExternalProductDependency(importPaths=[]){return importPaths.every(path=>!/(?:octalve-(?:invoice|finance|emr)|MerchantPreviewProvider|invoice-receipt-payment)/i.test(path));}
