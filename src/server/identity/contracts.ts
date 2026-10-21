import type {RegistrationInput} from './registration.ts';
export type EventType='register'|'verify'|'resend'|'login'|'recover'|'reset';
export type SignupProfile=Omit<RegistrationInput,'password'>;
export interface LoginRecord {userId:string;passwordDigest:string|null;verified:boolean;disabled:boolean}
export interface Principal {userId:string;verified:boolean;disabled:boolean}
export interface TokenRecord {digest:string;expiresAt:Date}
/** A real PostgreSQL adapter MUST implement token consumption and all credential updates
 * atomically, require matching purpose/expiry, and enforce a distributed rate limit.
 * No browser state or request-local Map may implement this contract in production. */
export interface IdentityRepository {
 allowAttempt(input:{event:EventType;key:string;at:Date}):Promise<boolean>;
 createPending(input:{profile:SignupProfile;passwordDigest:string;verification:TokenRecord;at:Date}):Promise<'created'|'exists'>;
 resend(input:{email:string;verification:TokenRecord;at:Date}):Promise<boolean>;
 consumeVerification(input:{digest:string;at:Date}):Promise<boolean>;
 getCredentials(email:string):Promise<LoginRecord|null>;
 createSession(input:{userId:string;digest:string;expiresAt:Date;at:Date}):Promise<boolean>;
 getSession(input:{digest:string;at:Date}):Promise<Principal|null>;
 revokeSession(input:{digest:string;at:Date}):Promise<void>;
 beginReset(input:{email:string;token:TokenRecord;at:Date}):Promise<boolean>;
 completeReset(input:{digest:string;passwordDigest:string;at:Date}):Promise<boolean>;
}
export interface IdentityMailer {
 verification(email:string,rawToken:string):Promise<void>;
 passwordReset(email:string,rawToken:string):Promise<void>;
}
export interface IdentityDependencies {db:IdentityRepository;mailer:IdentityMailer;pepper:string;now:()=>Date}
