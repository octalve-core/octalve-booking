import {NextResponse,type NextRequest} from 'next/server';
import {identityRuntime,configuredAppOrigin} from './runtime.ts';
import {trustedMutationOrigin} from './origin-policy.ts';
import {SESSION_COOKIE} from './security.ts';
import {getMyProfile,updateMyProfile,updateMyBusiness,changeMyPassword} from './service.ts';
import {authUnavailable} from './unavailable.ts';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const send=(body:object,status:number)=>NextResponse.json(body,{status,headers});
async function parse(request:NextRequest):Promise<Record<string,unknown>|null>{
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')??''))return null;
 const len=Number(request.headers.get('content-length'));
 if(Number.isFinite(len)&&len>10_240)return null;
 try{
  const body=await request.text();if(body.length>10_240)return null;
  const value=JSON.parse(body);
  return value&&typeof value==='object'&&!Array.isArray(value)?value:null;
 }catch{return null}
}
function sameOrigin(request:NextRequest):boolean{
 const origin=configuredAppOrigin();
 return !!origin&&trustedMutationOrigin(request.headers.get('origin'),origin)&&
  request.headers.get('sec-fetch-site')!=='cross-site';
}
export async function accountRead(request:NextRequest):Promise<NextResponse>{
 const db=await identityRuntime().catch(()=>null);
 if(!db)return authUnavailable();
 const token=request.cookies.get(SESSION_COOKIE)?.value;
 if(!token)return send({code:'AUTH_REQUIRED'},401);
 try{
  const profile=await getMyProfile(db,token);
  return profile?send({profile},200):send({code:'AUTH_REQUIRED'},401);
 }catch{return send({code:'SERVICE_UNAVAILABLE'},503)}
}
export async function accountMutation(request:NextRequest,action:'profile'|'business'|'password'):Promise<NextResponse>{
 if(!sameOrigin(request))return send({code:'ORIGIN_REJECTED'},403);
 const db=await identityRuntime().catch(()=>null);
 if(!db)return authUnavailable();
 const token=request.cookies.get(SESSION_COOKIE)?.value;
 if(!token)return send({code:'AUTH_REQUIRED'},401);
 const body=await parse(request);if(!body)return send({code:'INVALID_REQUEST'},400);
 try{
  if(action==='profile'){
   const state=await updateMyProfile(db,token,body);
   return state==='updated'?send({status:'updated'},200):send({code:state==='invalid'?'INVALID_PROFILE':'AUTH_REQUIRED'},state==='invalid'?400:403);
  }
  if(action==='business'){
   const {workspaceId,...patch}=body;
   if(typeof workspaceId!=='string')return send({code:'INVALID_REQUEST'},400);
   const state=await updateMyBusiness(db,token,workspaceId,patch);
   return state==='updated'?send({status:'updated'},200):send({code:state==='invalid'?'INVALID_BUSINESS':'ACCESS_DENIED'},state==='invalid'?400:403);
  }
  const {currentPassword,newPassword}=body;
  const success=await changeMyPassword(db,token,currentPassword,newPassword);
  if(!success)return send({code:'INVALID_CREDENTIALS_OR_PASSWORD'},400);
  const result=send({status:'password_updated',requiresSignIn:true},200);
  result.cookies.set(SESSION_COOKIE,'',{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:0});
  return result;
 }catch{return send({code:'SERVICE_UNAVAILABLE'},503)}
}
