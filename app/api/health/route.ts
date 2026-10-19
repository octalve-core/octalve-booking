import { NextResponse } from 'next/server';
export async function GET(){return NextResponse.json({service:'octalve-booking',status:'configuration_required',acceptingBookings:false},{status:200,headers:{'Cache-Control':'no-store'}})}
