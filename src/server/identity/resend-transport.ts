import type {AuthMailTransport} from './mail-outbox.ts';
import type {MailKind} from './mail-crypto.ts';
function requireVerifiedSender():{apiKey:string;from:string;origin:string}{
 const apiKey=process.env.RESEND_API_KEY,from=process.env.EMAIL_FROM,origin=process.env.BOOKING_APP_ORIGIN;
 if(!apiKey||!from||!origin||!/^https:\/\/[^/]+$/.test(origin))throw Error('BOOKING_EMAIL_NOT_CONFIGURED');
 if(/\r|\n|[<>].*[<>]/.test(from))throw Error('BOOKING_EMAIL_INVALID_SENDER');
 return {apiKey,from,origin};
}
function bodyForEmail(kind:MailKind,token:string,origin:string){
 const url=new URL(kind==='verification'?'/verify-email':'/reset-password',origin);
 url.searchParams.set('token',token);
 const title=kind==='verification'?'Verify your email':'Reset your password';
 const explanation=kind==='verification'?'To finish creating your Octalve Booking account, use the secure link below.':'If you requested a password reset, open the secure link below.';
 const expiry=kind==='verification'?'24 hours':'30 minutes';
 // This content is pre-defined: never interpolate recipient-controlled HTML.
 return {subject:title,text:`${explanation}\n\n${url.toString()}\n\nLink expires in ${expiry}. If you did not request this, ignore the email.`};
}
export function createResendAuthTransport():AuthMailTransport{
 return {async deliver({idempotencyKey,to,kind,token}){
  const config=requireVerifiedSender();
  const mail=bodyForEmail(kind,token,config.origin);
  const response=await fetch('https://api.resend.com/emails',{
   method:'POST',cache:'no-store',signal:AbortSignal.timeout(15000),
   headers:{Authorization:`Bearer ${config.apiKey}`,'Content-Type':'application/json',
    'Idempotency-Key':`booking-auth/${idempotencyKey}`},
   body:JSON.stringify({from:config.from,to:[to],subject:mail.subject,text:mail.text})
  });
  if(!response.ok)throw Error('AUTH_EMAIL_PROVIDER_REJECTED');
 }};
}
