import {digestOpaqueToken,hashPassword,issueOpaqueToken,SESSION_MAX_AGE_SECONDS,validatePassword,verifyPassword} from './security.ts';
import {normalizedEmail,readRegistrationInput} from './registration.ts';
import type {EventType,IdentityDependencies,PendingMail} from './contracts.ts';
import {sealMailToken} from './mail-crypto.ts';
export type PublicResult='accepted'|'invalid';
export type SignInResult={status:'authenticated';session:string;expiresAt:Date}|{status:'denied'};
const hours=(n:number)=>n*3600000;
function notice(deps:IdentityDependencies,kind:PendingMail['kind'],recipient:string,rawToken:string,expiry:Date):PendingMail{
 return {kind,recipient,sealedToken:sealMailToken(deps.mailEncryptionKey,kind,recipient,rawToken),expiresAt:expiry};
}
function clock(deps:IdentityDependencies):Date{const at=deps.now();if(!Number.isFinite(at.getTime()))throw Error('INVALID_SERVER_CLOCK');return at}
function tokenDigest(kind:'session'|'email-verification'|'password-reset',raw:string):string|null{try{return digestOpaqueToken(kind,raw)}catch{return null}}
async function allow(deps:IdentityDependencies,event:EventType,key:string,at:Date){return deps.db.allowAttempt({event,key,at})}
/** New users remain unverified and inactive. Duplicate emails return the same public result.
 * An encrypted email outbox item is persisted in the same transaction as the registration. */
export async function register(deps:IdentityDependencies,raw:unknown):Promise<PublicResult>{
 const values=readRegistrationInput(raw);if(!values)return 'invalid';
 const at=clock(deps);
 if(!await allow(deps,'register',values.email,at))return 'accepted';
 const {password,...profile}=values;
 const passwordDigest=await hashPassword(password,deps.pepper);
 const token=issueOpaqueToken('email-verification');
 const expiry=new Date(at.getTime()+hours(24));
 await deps.db.createPending({profile,passwordDigest,verification:{digest:token.digest,expiresAt:expiry},notice:notice(deps,'verification',values.email,token.token,expiry),at});
 return 'accepted';
}
export async function resendVerification(deps:IdentityDependencies,rawEmail:unknown):Promise<PublicResult>{
 const email=normalizedEmail(rawEmail);if(!email)return 'invalid';
 const at=clock(deps);if(!await allow(deps,'resend',email,at))return 'accepted';
 const token=issueOpaqueToken('email-verification');
 const expiry=new Date(at.getTime()+hours(24));
 await deps.db.resend({email,verification:{digest:token.digest,expiresAt:expiry},notice:notice(deps,'verification',email,token.token,expiry),at});
 return 'accepted';
}
export async function verifyEmail(deps:IdentityDependencies,rawToken:string):Promise<boolean>{
 const digest=tokenDigest('email-verification',rawToken);if(!digest)return false;
 const at=clock(deps);if(!await allow(deps,'verify',digest,at))return false;
 return deps.db.consumeVerification({digest,at});
}
/** Session creation must recheck active/verified user atomically in the database. */
export async function signIn(deps:IdentityDependencies,rawEmail:unknown,rawPassword:unknown):Promise<SignInResult>{
 const email=normalizedEmail(rawEmail);
 if(!email||typeof rawPassword!=='string'||rawPassword.length>128)return {status:'denied'};
 const at=clock(deps);if(!await allow(deps,'login',email,at))return {status:'denied'};
 const user=await deps.db.getCredentials(email);
 if(!user||user.disabled||!user.verified||!user.passwordDigest)return {status:'denied'};
 if(!await verifyPassword(rawPassword,user.passwordDigest,deps.pepper))return {status:'denied'};
 const token=issueOpaqueToken('session');
 const expiresAt=new Date(at.getTime()+SESSION_MAX_AGE_SECONDS*1000);
 if(!await deps.db.createSession({userId:user.userId,digest:token.digest,expiresAt,at}))return {status:'denied'};
 return {status:'authenticated',session:token.token,expiresAt};
}
export async function currentSession(deps:IdentityDependencies,rawToken:string):Promise<{userId:string}|null>{
 const digest=tokenDigest('session',rawToken);if(!digest)return null;
 const user=await deps.db.getSession({digest,at:clock(deps)});
 return user&&!user.disabled&&user.verified?{userId:user.userId}:null;
}
export async function signOut(deps:IdentityDependencies,rawToken:string):Promise<void>{
 const digest=tokenDigest('session',rawToken);if(digest)await deps.db.revokeSession({digest,at:clock(deps)});
}
/** No account existence disclosures, including unknown or inactive identities. */
export async function requestPasswordReset(deps:IdentityDependencies,rawEmail:unknown):Promise<PublicResult>{
 const email=normalizedEmail(rawEmail);if(!email)return 'invalid';
 const at=clock(deps);if(!await allow(deps,'recover',email,at))return 'accepted';
 const token=issueOpaqueToken('password-reset');
 const expiry=new Date(at.getTime()+hours(0.5));
 await deps.db.beginReset({email,token:{digest:token.digest,expiresAt:expiry},notice:notice(deps,'password-reset',email,token.token,expiry),at});
 return 'accepted';
}
/** Database MUST consume token, update password and revoke ALL sessions in one transaction. */
export async function resetPassword(deps:IdentityDependencies,rawToken:string,rawPassword:unknown):Promise<boolean>{
 const digest=tokenDigest('password-reset',rawToken);
 if(!digest||typeof rawPassword!=='string'||!validatePassword(rawPassword))return false;
 const at=clock(deps);if(!await allow(deps,'reset',digest,at))return false;
 return deps.db.completeReset({digest,passwordDigest:await hashPassword(rawPassword,deps.pepper),at});
}

export function readProfilePatch(raw:unknown):import('./contracts.ts').ProfilePatch|null{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const r=raw as Record<string,unknown>,allowed=['fullName','phoneE164'];
 if(!Object.keys(r).length||Object.keys(r).some(k=>!allowed.includes(k)))return null;
 const patch:import('./contracts.ts').ProfilePatch={};
 if(Object.hasOwn(r,'fullName')){
  if(typeof r.fullName!=='string'||r.fullName.trim().length<2||r.fullName.trim().length>120)return null;
  patch.fullName=r.fullName.trim();
 }
 if(Object.hasOwn(r,'phoneE164')){
  if(r.phoneE164===null||r.phoneE164==='')patch.phoneE164=null;
  else if(typeof r.phoneE164==='string'&&/^\+[1-9]\d{6,14}$/.test(r.phoneE164))patch.phoneE164=r.phoneE164;
  else return null;
 }
 return patch;
}
export function readBusinessPatch(raw:unknown):import('./contracts.ts').BusinessPatch|null{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const r=raw as Record<string,unknown>,allowed=['name','website','timezone','currency'];
 if(!Object.keys(r).length||Object.keys(r).some(k=>!allowed.includes(k)))return null;
 const patch:import('./contracts.ts').BusinessPatch={};
 if(Object.hasOwn(r,'name')){
  if(typeof r.name!=='string'||r.name.trim().length<2||r.name.trim().length>120)return null;
  patch.name=r.name.trim();
 }
 if(Object.hasOwn(r,'website')){
  if(r.website===null||r.website==='')patch.website=null;
  else if(typeof r.website==='string'){
   try{const url=new URL(r.website);if(url.protocol!=='https:'||url.username||url.password||url.href.length>2048)return null;patch.website=url.href}catch{return null}
  }else return null;
 }
 if(Object.hasOwn(r,'timezone')){
  if(typeof r.timezone!=='string')return null;
  try{new Intl.DateTimeFormat('en',{timeZone:r.timezone})}catch{return null}
  patch.timezone=r.timezone;
 }
 if(Object.hasOwn(r,'currency')){
  if(typeof r.currency!=='string'||!/^[A-Z]{3}$/.test(r.currency))return null;
  patch.currency=r.currency;
 }
 return patch;
}
export async function getMyProfile(deps:IdentityDependencies,token:string){
 const user=await currentSession(deps,token);
 return user?deps.db.getAccountProfile(user.userId):null;
}
export async function updateMyProfile(deps:IdentityDependencies,token:string,raw:unknown):Promise<'updated'|'invalid'|'denied'>{
 const patch=readProfilePatch(raw);if(!patch)return 'invalid';
 const user=await currentSession(deps,token);if(!user)return 'denied';
 return await deps.db.updateAccountProfile({userId:user.userId,patch,at:clock(deps)})?'updated':'denied';
}
export async function updateMyBusiness(deps:IdentityDependencies,token:string,workspaceId:string,raw:unknown):Promise<'updated'|'invalid'|'denied'>{
 const patch=readBusinessPatch(raw);
 if(!patch||!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(workspaceId))return 'invalid';
 const user=await currentSession(deps,token);if(!user)return 'denied';
 return await deps.db.updateBusinessIdentity({userId:user.userId,workspaceId,patch,at:clock(deps)})?'updated':'denied';
}
export async function changeMyPassword(deps:IdentityDependencies,token:string,oldPassword:unknown,newPassword:unknown):Promise<boolean>{
 if(typeof oldPassword!=='string'||typeof newPassword!=='string'||!validatePassword(newPassword)||oldPassword===newPassword)return false;
 const user=await currentSession(deps,token);if(!user)return false;
 const at=clock(deps);
 if(!await allow(deps,'login',user.userId,at))return false;
 // Resolve credentials from the identity associated with this verified session.
 const profile=await deps.db.getAccountProfile(user.userId);if(!profile)return false;
 const record=await deps.db.getCredentials(profile.email);
 if(!record||record.userId!==user.userId||record.disabled||!record.verified||!record.passwordDigest)return false;
 if(!await verifyPassword(oldPassword,record.passwordDigest,deps.pepper))return false;
 const replacement=await hashPassword(newPassword,deps.pepper);
 return deps.db.changePassword({userId:user.userId,expectedDigest:record.passwordDigest,newDigest:replacement,at});
}
