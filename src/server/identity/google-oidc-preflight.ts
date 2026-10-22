import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
/** These contracts are preparatory ONLY: Google sign-in is explicitly disabled.
 * The callback MUST verify token signatures against Google's trusted JWKS first,
 * then call validateVerifiedGoogleClaims. Never pass decoded/unverified JWT claims. */
const enc=(n:number)=>randomBytes(n).toString('base64url');
export type GoogleStart={state:string;nonce:string;verifier:string;challenge:string};
export function createGoogleOidcStart():GoogleStart{
 const state=enc(32),nonce=enc(32),verifier=enc(48);
 return {state,nonce,verifier,challenge:createHash('sha256').update(verifier).digest('base64url')};
}
function secureEquals(a:string,b:string):boolean{
 if(typeof a!=='string'||typeof b!=='string')return false;
 const left=Buffer.from(a),right=Buffer.from(b);
 return left.length>=32&&left.length===right.length&&timingSafeEqual(left,right);
}
export function validateOAuthCallbackState(saved:string,received:string):boolean{
 return /^[A-Za-z0-9_-]{43}$/.test(saved)&&secureEquals(saved,received);
}
export interface VerifiedGoogleClaims {
 iss:string;aud:string;azp?:string;sub:string;email:string;email_verified:boolean;
 nonce:string;iat:number;exp:number
}
/** Accepts ALREADY signature-verified claims, never arbitrary decoded JSON. */
export function validateVerifiedGoogleClaims(
 claims:VerifiedGoogleClaims,config:{clientId:string;nonce:string;nowSeconds:number}
):{subject:string;email:string}|null{
 if(!config.clientId||!claims||!Number.isFinite(config.nowSeconds))return null;
 if(!['https://accounts.google.com','accounts.google.com'].includes(claims.iss))return null;
 if(claims.aud!==config.clientId||(claims.azp!==undefined&&claims.azp!==config.clientId))return null;
 if(!/^[0-9]{1,32}$/.test(claims.sub))return null;
 if(!claims.email_verified||typeof claims.email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claims.email))return null;
 if(!secureEquals(claims.nonce,config.nonce))return null;
 if(!Number.isInteger(claims.iat)||!Number.isInteger(claims.exp)||claims.iat>config.nowSeconds+60||claims.exp<=config.nowSeconds||claims.exp-claims.iat>3600)return null;
 return {subject:claims.sub,email:claims.email.trim().toLowerCase()};
}
/** Existing-password accounts are NEVER silently linked by matching email.
 * Require an already-authenticated account owner and a fresh verified challenge. */
export function mayLinkGoogleIdentity(existingAccountAuthenticated:boolean,challengeFresh:boolean):boolean{
 return existingAccountAuthenticated===true&&challengeFresh===true;
}
