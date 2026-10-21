import {NextResponse} from 'next/server';
/** Authentication is disabled until isolated database, verified email transport,
 * transactional rate limiting, rotation/revocation, and Google OIDC are provisioned. */
export function authUnavailable(){
 return NextResponse.json({code:'BOOKING_AUTH_NOT_CONFIGURED',message:'Account services are being configured.'},{
 status:503,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Retry-After':'3600'}});
}
