import {NextResponse,type NextRequest} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import {identityRuntime} from '@/src/server/identity/runtime';
import {identityPool} from '@/src/server/identity/pg-driver';
import {dispatchAuthOutbox,expireAuthOutbox} from '@/src/server/identity/mail-outbox';
import {createResendAuthTransport} from '@/src/server/identity/resend-transport';
export const runtime='nodejs';
function authorized(auth:string|null,secret:string|undefined){
 if(!auth||!secret||secret.length<32)return false;
 const expected=Buffer.from('Bearer '+secret);
 const given=Buffer.from(auth);
 return expected.length===given.length&&timingSafeEqual(given,expected);
}
export async function POST(request:NextRequest){
 if(!authorized(request.headers.get('authorization'),process.env.AUTH_OUTBOX_CRON_SECRET))
  return NextResponse.json({code:'UNAUTHORIZED'},{status:401,headers:{'Cache-Control':'no-store'}});
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM||!process.env.AUTH_MAIL_ENCRYPTION_KEY)
  return NextResponse.json({code:'EMAIL_NOT_CONFIGURED'},{status:503});
 try{
  if(!await identityRuntime())return NextResponse.json({code:'AUTH_NOT_CONFIGURED'},{status:503});
  const pool=identityPool();
  const expired=await expireAuthOutbox(pool);
  const result=await dispatchAuthOutbox(pool,createResendAuthTransport(),{mailEncryptionKey:process.env.AUTH_MAIL_ENCRYPTION_KEY,batchSize:10});
  return NextResponse.json({expiredBeforeDispatch:expired,...result},{headers:{'Cache-Control':'no-store'}});
 }catch{
  return NextResponse.json({code:'WORKER_UNAVAILABLE'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
