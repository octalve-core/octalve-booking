/** Server-only launch configuration. Import only from trusted server modules.
 * Never expose these variables through NEXT_PUBLIC_ or send values to clients. */
export type BookingFeature='auth'|'submissions'|'payments'|'notifications';
export const featureEnv:Record<BookingFeature,string>={
 auth:'BOOKING_AUTH_ENABLED',submissions:'BOOKING_SUBMISSIONS_ENABLED',
 payments:'BOOKING_PAYMENTS_ENABLED',notifications:'BOOKING_NOTIFICATIONS_ENABLED'
};
export function requestedFeature(feature:BookingFeature,env:NodeJS.ProcessEnv=process.env):boolean{
 return env[featureEnv[feature]]==='1';
}
export function missingEnv(names:readonly string[],env:NodeJS.ProcessEnv=process.env):string[]{
 return names.filter(n=>!env[n]||!env[n]?.trim());
}
export function validateBookingOrigin(value:string|undefined):string|null{
 if(!value)return null;
 try{
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)return null;
  return url.origin===value?value:null;
 }catch{return null}
}
/** Feature switches may NEVER override backend capability truth. */
export function productionCapability(
 feature:BookingFeature,
 deps:{persistentDatabase:boolean;verifiedEmail:boolean;permissionGuard:boolean;providerVerified?:boolean},
 env:NodeJS.ProcessEnv=process.env
):boolean{
 if(!requestedFeature(feature,env)||!deps.persistentDatabase||!deps.permissionGuard)return false;
 if(feature==='auth')return deps.verifiedEmail;
 if(feature==='payments'||feature==='notifications')return deps.providerVerified===true;
 return deps.verifiedEmail;
}
