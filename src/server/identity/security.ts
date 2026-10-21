import {createHash,createHmac,randomBytes,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';

const scrypt=promisify(scryptCallback);
const workFactor={N:32768,r:8,p:1,maxmem:64*1024*1024} as const;
const hashScheme='booking-scrypt-v1';
const SESSION_BYTES=32;
function secretBuffer(value:string):Buffer {
 if(typeof value!=='string'||Buffer.byteLength(value,'utf8')<32)throw new Error('SERVER_SECRET_NOT_CONFIGURED');
 return Buffer.from(value,'utf8');
}
export function validatePassword(password:string):boolean {
 // NIST long-password baseline; never silently trim/change user-supplied passwords.
 return typeof password==='string'&&password.length>=15&&Buffer.byteLength(password,'utf8')<=1024&&password.length<=128;
}
function keyedPassword(password:string,pepper:string):Buffer {
 return createHmac('sha256',secretBuffer(pepper)).update(password,'utf8').digest();
}
export async function hashPassword(password:string,pepper:string):Promise<string>{
 if(!validatePassword(password))throw new Error('INVALID_PASSWORD');
 const salt=randomBytes(24);
 const derived=await scrypt(keyedPassword(password,pepper),salt,64,workFactor) as Buffer;
 return [hashScheme,salt.toString('base64url'),derived.toString('base64url')].join('$');
}
export async function verifyPassword(password:string,stored:string,pepper:string):Promise<boolean>{
 if(typeof password!=='string'||Buffer.byteLength(password,'utf8')>1024||typeof stored!=='string')return false;
 const parts=stored.split('$');
 if(parts.length!==3||parts[0]!==hashScheme)return false;
 try{
  const salt=Buffer.from(parts[1],'base64url'),hash=Buffer.from(parts[2],'base64url');
  if(salt.length!==24||hash.length!==64)return false;
  const candidate=await scrypt(keyedPassword(password,pepper),salt,64,workFactor) as Buffer;
  return timingSafeEqual(hash,candidate);
 }catch{return false}
}
export type TokenPurpose='email-verification'|'password-reset'|'session'|'invitation'|'oauth-state';
export function issueOpaqueToken(purpose:TokenPurpose):{token:string;digest:string}{
 const token=randomBytes(SESSION_BYTES).toString('base64url');
 return {token,digest:digestOpaqueToken(purpose,token)};
}
export function digestOpaqueToken(purpose:TokenPurpose,token:string):string {
 // Purpose separation prevents an email-reset token from being reused as a session.
 if(typeof token!=='string'||!(/^[A-Za-z0-9_-]{43}$/.test(token)))throw new Error('INVALID_TOKEN');
 return createHash('sha256').update('octalve-booking:'+purpose+':'+token,'utf8').digest('hex');
}
export function equalOpaqueDigest(expected:string,provided:string):boolean{
 if(!/^[0-9a-f]{64}$/.test(expected)||!/^[0-9a-f]{64}$/.test(provided))return false;
 return timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(provided,'hex'));
}
export const SESSION_COOKIE='__Host-octalve_booking_session';
export const SESSION_MAX_AGE_SECONDS=60*60*24*7;
export function sessionCookieOptions(now=new Date()){
 return {httpOnly:true,secure:true,sameSite:'lax' as const,path:'/',expires:new Date(now.getTime()+SESSION_MAX_AGE_SECONDS*1000),maxAge:SESSION_MAX_AGE_SECONDS};
}
