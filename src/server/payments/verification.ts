import {createHmac,timingSafeEqual} from 'node:crypto';
function equalText(a:string,b:string):boolean{
 if(typeof a!=='string'||typeof b!=='string'||a.length<16||b.length<16||a.length>256||b.length>256)return false;
 const left=Buffer.from(a,'utf8'),right=Buffer.from(b,'utf8');
 return left.length===right.length&&timingSafeEqual(left,right);
}
export function verifyPaystackWebhook(rawBody:Buffer,signature:string|null,secret:string):boolean{
 if(!signature||!/^[a-f0-9]{128}$/i.test(signature)||!secret||secret.length<12||rawBody.length>256*1024)return false;
 const digest=createHmac('sha512',secret).update(rawBody).digest('hex');
 return equalText(digest,signature.toLowerCase());
}
/** Flutterwave v3 and v4 have different signature formats. No version guessing.
 * v3: exact verif-hash. v4: base64(HMAC-SHA256(rawBody,secret)). */
export function verifyFlutterwaveV3(signature:string|null,secret:string):boolean{
 return !!secret&&secret.length>=16&&!!signature&&equalText(signature,secret);
}
export function verifyFlutterwaveV4(rawBody:Buffer,signature:string|null,secret:string):boolean{
 if(!signature||!secret||secret.length<16||rawBody.length>256*1024)return false;
 const hash=createHmac('sha256',secret).update(rawBody).digest('base64');
 return equalText(signature,hash);
}
export type PaymentTruth={provider:'paystack'|'flutterwave'|'monnify';providerChecked:boolean;reference:string;currency:string;amountMinor:number;status:'success'|'failed'|'pending'};
export type PaymentIntent={reference:string;currency:string;amountMinor:number};
export function canSettleIntent(intent:PaymentIntent,truth:PaymentTruth):boolean{
 return truth.providerChecked===true&&truth.status==='success'&&truth.reference===intent.reference&&truth.currency===intent.currency&&Number.isSafeInteger(truth.amountMinor)&&truth.amountMinor===intent.amountMinor&&truth.amountMinor>0;
}
