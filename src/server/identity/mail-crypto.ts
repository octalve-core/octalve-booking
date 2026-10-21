import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
export type MailKind='verification'|'password-reset';
export type SealedNotice={kind:MailKind;recipient:string;sealedToken:string;expiresAt:Date};
const aad=(kind:MailKind,recipient:string)=>Buffer.from('octalve-booking:mail:v1:'+kind+':'+recipient,'utf8');
function decodeMailKey(encoded:string):Buffer{
 if(typeof encoded!=='string'||!(/^[a-zA-Z0-9_-]{43}$/.test(encoded)))throw new Error('AUTH_MAIL_KEY_NOT_CONFIGURED');
 const key=Buffer.from(encoded,'base64url');
 if(key.length!==32)throw new Error('AUTH_MAIL_KEY_NOT_CONFIGURED');
 return key;
}
export function sealMailToken(key:string,kind:MailKind,recipient:string,rawToken:string):string{
 if(!recipient||!(/^[A-Za-z0-9_-]{43}$/.test(rawToken)))throw new Error('INVALID_AUTH_MAIL');
 const iv=randomBytes(12);
 const cipher=createCipheriv('aes-256-gcm',decodeMailKey(key),iv);
 cipher.setAAD(aad(kind,recipient));
 const encrypted=Buffer.concat([cipher.update(rawToken,'utf8'),cipher.final()]);
 const tag=cipher.getAuthTag();
 return 'v1.'+[iv,encrypted,tag].map(v=>v.toString('base64url')).join('.');
}
export function unsealMailToken(key:string,kind:MailKind,recipient:string,sealed:string):string{
 if(typeof sealed!=='string'||!(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(sealed)))throw new Error('INVALID_AUTH_MAIL');
 const [version,ivText,cipherText,tagText]=sealed.split('.');
 if(version!=='v1')throw new Error('INVALID_AUTH_MAIL');
 const iv=Buffer.from(ivText,'base64url'),encrypted=Buffer.from(cipherText,'base64url'),tag=Buffer.from(tagText,'base64url');
 if(iv.length!==12||tag.length!==16||encrypted.length!==43)throw new Error('INVALID_AUTH_MAIL');
 try{
  const decipher=createDecipheriv('aes-256-gcm',decodeMailKey(key),iv);
  decipher.setAAD(aad(kind,recipient));
  decipher.setAuthTag(tag);
  const decoded=Buffer.concat([decipher.update(encrypted),decipher.final()]).toString('utf8');
  if(!(/^[A-Za-z0-9_-]{43}$/.test(decoded)))throw new Error('INVALID_AUTH_MAIL');
  return decoded;
 }catch{throw new Error('INVALID_AUTH_MAIL')}
}
