import { NextResponse } from 'next/server';
/** Fail closed until real authentication, availability, holds and payment authority exist. */
const unavailable=()=>NextResponse.json({code:'BOOKING_SERVICE_NOT_CONFIGURED',message:'Booking submission is not available until business setup and required verification are complete.'},{status:503,headers:{'Cache-Control':'no-store'}});
export const GET=unavailable;
export const POST=unavailable;
