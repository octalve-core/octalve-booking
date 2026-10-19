import { NextResponse } from 'next/server';
/** Never accepts merchant credentials until encryption, authentication, and provider adapters exist. */
export async function POST(){return NextResponse.json({code:'INTEGRATIONS_NOT_CONFIGURED',message:'Provider connections require a verified and authenticated business account.'},{status:503,headers:{'Cache-Control':'no-store'}})}
