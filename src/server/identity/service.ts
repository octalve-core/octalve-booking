import {digestOpaqueToken,hashPassword,issueOpaqueToken,SESSION_MAX_AGE_SECONDS,validatePassword,verifyPassword} from './security.ts';
import {normalizedEmail,readRegistrationInput} from './registration.ts';
import type {EventType,IdentityDependencies} from './contracts.ts';
export type PublicResult='accepted'|'invalid';
export type SignInResult={status:'authenticated';session:string;expiresAt:Date}|{status:'denied'};
const hours=(n:number)=>n*3600000;
function clock(deps:IdentityDependencies):Date{const at=deps.now();if(!Number.isFinite(at.getTime()))throw Error('INVALID_SERVER_CLOCK');return at}
function tokenDigest(kind:'session'|'email-verification'|'password-reset',raw:string):string|null{try{return digestOpaqueToken(kind,raw)}catch{return null}}
async function allow(deps:IdentityDependencies,event:EventType,key:string,at:Date){return deps.db.allowAttempt({event,key,at})}
/** New users remain unverified and inactive. Duplicate emails return the same public result.
 * Mail delivery follows a committed pending registration; resend provides recovery. */
export async function register(deps:IdentityDependencies,raw:unknown):Promise<PublicResult>{
 const values=readRegistrationInput(raw);if(!values)return 'invalid';
 const at=clock(deps);
 if(!await allow(deps,'register',values.email,at))return 'accepted';
 const {password,...profile}=values;
 const passwordDigest=await hashPassword(password,deps.pepper);
 const token=issueOpaqueToken('email-verification');
 const outcome=await deps.db.createPending({profile,passwordDigest,verification:{digest:token.digest,expiresAt:new Date(at.getTime()+hours(24))},at});
 if(outcome==='created')await deps.mailer.verification(values.email,token.token);
 return 'accepted';
}
export async function resendVerification(deps:IdentityDependencies,rawEmail:unknown):Promise<PublicResult>{
 const email=normalizedEmail(rawEmail);if(!email)return 'invalid';
 const at=clock(deps);if(!await allow(deps,'resend',email,at))return 'accepted';
 const token=issueOpaqueToken('email-verification');
 const stored=await deps.db.resend({email,verification:{digest:token.digest,expiresAt:new Date(at.getTime()+hours(24))},at});
 if(stored)await deps.mailer.verification(email,token.token);
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
 const stored=await deps.db.beginReset({email,token:{digest:token.digest,expiresAt:new Date(at.getTime()+hours(0.5))},at});
 if(stored)await deps.mailer.passwordReset(email,token.token);
 return 'accepted';
}
/** Database MUST consume token, update password and revoke ALL sessions in one transaction. */
export async function resetPassword(deps:IdentityDependencies,rawToken:string,rawPassword:unknown):Promise<boolean>{
 const digest=tokenDigest('password-reset',rawToken);
 if(!digest||typeof rawPassword!=='string'||!validatePassword(rawPassword))return false;
 const at=clock(deps);if(!await allow(deps,'reset',digest,at))return false;
 return deps.db.completeReset({digest,passwordDigest:await hashPassword(rawPassword,deps.pepper),at});
}
