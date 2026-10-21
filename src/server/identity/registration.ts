export type SignupAccountType='individual'|'business';
export interface RegistrationInput {kind:SignupAccountType;fullName:string;email:string;password:string;phoneE164?:string;businessName?:string;website?:string;timezone?:string;currency?:string}
export function normalizedEmail(value:unknown):string|null {
 if(typeof value!=='string')return null;
 const email=value.trim().toLowerCase();
 if(email.length>254||email.length<5||!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))return null;
 return email;
}
export function phoneE164(value:unknown):string|null {
 return typeof value==='string'&&/^\+[1-9]\d{6,14}$/.test(value)?value:null;
}
export function readRegistrationInput(value:unknown):RegistrationInput|null {
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const fields=value as Record<string,unknown>;
 const email=normalizedEmail(fields.email);
 const fullName=typeof fields.fullName==='string'?fields.fullName.trim():'';
 if(!email||fullName.length<2||fullName.length>120||!(['individual','business'].includes(String(fields.kind))))return null;
 if(typeof fields.password!=='string'||fields.password.length<15||fields.password.length>128||Buffer.byteLength(fields.password,'utf8')>1024)return null;
 const phone=fields.phoneE164===undefined||fields.phoneE164===''?undefined:phoneE164(fields.phoneE164);
 if(phone===null)return null;
 const businessName=fields.businessName===undefined||fields.businessName===''?undefined:(typeof fields.businessName==='string'?fields.businessName.trim():null);
 if(businessName===null||businessName!==undefined&&(businessName.length<2||businessName.length>120))return null;
 const website=typeof fields.website==='string'&&fields.website.trim()?fields.website.trim():undefined;
 if(website){try{const url=new URL(website);if(url.protocol!=='https:'||url.username||url.password||url.href.length>2048)return null}catch{return null}}
 const timezone=typeof fields.timezone==='string'&&fields.timezone.trim()?fields.timezone.trim():undefined;
 const currency=typeof fields.currency==='string'&&/^[A-Z]{3}$/.test(fields.currency)?fields.currency:undefined;
 if(timezone&&(!/^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/.test(timezone)&&timezone!=='UTC'))return null;
 // Never accept self-assigned role, verified, active or workspace ID from browser input.
 return {kind:fields.kind as SignupAccountType,fullName,email,password:fields.password,phoneE164:phone,businessName:businessName??undefined,website,timezone,currency};
}
