import {NextResponse,type NextRequest} from 'next/server';
import {register,signIn,requestPasswordReset,resetPassword,verifyEmail,resendVerification,signOut,currentSession} from './service.ts';
import {identityRuntime,configuredAppOrigin} from './runtime.ts';
import {authUnavailable} from './unavailable.ts';
import {trustedMutationOrigin} from './origin-policy.ts';
import {SESSION_COOKIE,sessionCookieOptions} from './security.ts';

type Operation='register'|'login'|'forgot-password'|'reset-password'|'verify-email'|'resend-verification'|'logout';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const result=(body:object,status:number)=>NextResponse.json(body,{status,headers});
async function parseJson(request:NextRequest):Promise<Record<string,unknown>|null>{
 const type=request.headers.get('content-type')??'';
 const declared=Number(request.headers.get('content-length'));
 if(!type.toLowerCase().startsWith('application/json')||(Number.isFinite(declared)&&declared>10_240))return null;
 try{
  const raw=await request.text();
  if(raw.length>10_240)return null;
  const data=JSON.parse(raw);
  if(!data||typeof data!=='object'||Array.isArray(data))return null;
  return data as Record<string,unknown>;
 }catch{return null}
}
function originAllowed(request:NextRequest):boolean{
 const origin=configuredAppOrigin();
 return !!origin&&trustedMutationOrigin(request.headers.get('origin'),origin)
   &&request.headers.get('sec-fetch-site')!=='cross-site';
}
export async function authenticatedOperation(request:NextRequest,operation:Operation):Promise<NextResponse>{
 if(!originAllowed(request))return result({code:'ORIGIN_REJECTED'},403);
 const deps=await identityRuntime().catch(()=>null);
 if(!deps)return authUnavailable();
 try{
  if(operation==='logout'){
   const token=request.cookies.get(SESSION_COOKIE)?.value;
   if(token)await signOut(deps,token);
   const response=result({status:'signed_out'},200);
   response.cookies.set(SESSION_COOKIE,'',{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:0});
   return response;
  }
  const data=await parseJson(request);
  if(!data)return result({code:'INVALID_REQUEST'},400);
  if(operation==='register'){
   const status=await register(deps,data);
   return status==='invalid'?result({code:'INVALID_REGISTRATION'},400):result({status:'accepted'},202);
  }
  if(operation==='login'){
   const auth=await signIn(deps,data.email,data.password);
   if(auth.status!=='authenticated')return result({code:'INVALID_CREDENTIALS'},401);
   const response=result({status:'authenticated'},200);
   response.cookies.set(SESSION_COOKIE,auth.session,sessionCookieOptions());
   return response;
  }
  if(operation==='forgot-password'){
   const outcome=await requestPasswordReset(deps,data.email);
   return outcome==='invalid'?result({code:'INVALID_EMAIL'},400):result({status:'accepted'},202);
  }
  if(operation==='reset-password'){
   if(typeof data.token!=='string')return result({code:'INVALID_TOKEN'},400);
   const valid=await resetPassword(deps,data.token,data.password);
   return valid?result({status:'reset'},200):result({code:'INVALID_OR_EXPIRED_TOKEN'},400);
  }
  if(operation==='verify-email'){
   if(typeof data.token!=='string')return result({code:'INVALID_TOKEN'},400);
   const verified=await verifyEmail(deps,data.token);
   return verified?result({status:'verified'},200):result({code:'INVALID_OR_EXPIRED_TOKEN'},400);
  }
  if(operation==='resend-verification'){
   const outcome=await resendVerification(deps,data.email);
   return outcome==='invalid'?result({code:'INVALID_EMAIL'},400):result({status:'accepted'},202);
  }
  return authUnavailable();
 }catch{
  // Never reflect PostgreSQL, password, token or email transport details to callers.
  return result({code:'SERVICE_TEMPORARILY_UNAVAILABLE'},503);
 }
}
export async function sessionStatus(request:NextRequest):Promise<NextResponse>{
 const deps=await identityRuntime().catch(()=>null);
 if(!deps)return authUnavailable();
 const token=request.cookies.get(SESSION_COOKIE)?.value;
 if(!token)return result({authenticated:false},401);
 try{
  const user=await currentSession(deps,token);
  return user?result({authenticated:true},200):result({authenticated:false},401);
 }catch{return result({code:'SERVICE_TEMPORARILY_UNAVAILABLE'},503)}
}
