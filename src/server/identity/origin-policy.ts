/** One layer of CSRF defense for future state-changing cookie-authenticated routes.
 * Require a configured HTTPS canonical site origin and browser Origin match.
 * This does not replace SameSite cookies, CSRF tokens or stateful authorization. */
export function trustedMutationOrigin(requestOrigin:string|null,canonicalSite:string):boolean{
 if(!requestOrigin||!canonicalSite)return false;
 try{
  const expected=new URL(canonicalSite),given=new URL(requestOrigin);
  if(expected.protocol!=='https:'||given.protocol!=='https:')return false;
  if(expected.username||expected.password||given.username||given.password)return false;
  if(expected.pathname!=='/'||expected.search||expected.hash)return false;
  if(given.pathname!=='/'||given.search||given.hash)return false;
  return expected.origin===given.origin&&canonicalSite===expected.origin&&requestOrigin===given.origin;
 }catch{return false}
}
