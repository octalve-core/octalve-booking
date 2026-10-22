import type {RegistrationInput} from './registration.ts';
export type EventType='register'|'verify'|'resend'|'login'|'recover'|'reset';
export type SignupProfile=Omit<RegistrationInput,'password'>;
export interface LoginRecord {userId:string;passwordDigest:string|null;verified:boolean;disabled:boolean}
export interface Principal {userId:string;verified:boolean;disabled:boolean}
export interface TokenRecord {digest:string;expiresAt:Date}
export interface AccountProfile {userId:string;fullName:string;email:string;phoneE164:string|null;workspaces:Array<{id:string;name:string;kind:'individual'|'business';role:string;timezone:string;currency:string;website:string|null}>}
export interface ProfilePatch {fullName?:string;phoneE164?:string|null}
export interface BusinessPatch {name?:string;website?:string|null;timezone?:string;currency?:string}
export interface PendingMail {kind:'verification'|'password-reset';recipient:string;sealedToken:string;expiresAt:Date}
/** A real PostgreSQL adapter MUST implement token consumption and all credential updates
 * atomically, require matching purpose/expiry, and enforce a distributed rate limit.
 * No browser state or request-local Map may implement this contract in production. */
export interface IdentityRepository {
 allowAttempt(input:{event:EventType;key:string;at:Date}):Promise<boolean>;
 createPending(input:{profile:SignupProfile;passwordDigest:string;verification:TokenRecord;notice:PendingMail;at:Date}):Promise<'created'|'exists'>;
 resend(input:{email:string;verification:TokenRecord;notice:PendingMail;at:Date}):Promise<boolean>;
 consumeVerification(input:{digest:string;at:Date}):Promise<boolean>;
 getCredentials(email:string):Promise<LoginRecord|null>;
 getAccountProfile(userId:string):Promise<AccountProfile|null>;
 updateAccountProfile(input:{userId:string;patch:ProfilePatch;at:Date}):Promise<boolean>;
 updateBusinessIdentity(input:{userId:string;workspaceId:string;patch:BusinessPatch;at:Date}):Promise<boolean>;
 changePassword(input:{userId:string;expectedDigest:string;newDigest:string;at:Date}):Promise<boolean>;
 createSession(input:{userId:string;digest:string;expiresAt:Date;at:Date}):Promise<boolean>;
 getSession(input:{digest:string;at:Date}):Promise<Principal|null>;
 revokeSession(input:{digest:string;at:Date}):Promise<void>;
 beginReset(input:{email:string;token:TokenRecord;notice:PendingMail;at:Date}):Promise<boolean>;
 completeReset(input:{digest:string;passwordDigest:string;at:Date}):Promise<boolean>;
}
export interface IdentityDependencies {db:IdentityRepository;pepper:string;mailEncryptionKey:string;now:()=>Date}
