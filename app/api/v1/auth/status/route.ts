import {NextResponse} from 'next/server';
import {identityRuntime} from '@/src/server/identity/runtime';
export const runtime='nodejs';
export async function GET(){
 const deps=await identityRuntime().catch(()=>null);
 return NextResponse.json({available:!!deps},{headers:{'Cache-Control':'no-store'}});
}
