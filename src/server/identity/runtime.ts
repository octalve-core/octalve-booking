import type {IdentityDependencies} from './contracts.ts';
import {createPgIdentityRepository} from './postgres.ts';
import {getBookingPgPool} from './pg-driver.ts';
import {validateBookingOrigin,requestedFeature,missingEnv} from '../config.ts';

const needed=['DATABASE_URL','AUTH_PASSWORD_PEPPER','AUTH_MAIL_ENCRYPTION_KEY','AUTH_RATE_KEY_SECRET','EMAIL_FROM','RESEND_API_KEY'] as const;
export function configuredAppOrigin():string|null{
 return validateBookingOrigin(process.env.BOOKING_APP_ORIGIN);
}
/** Force fail-closed until a distinct non-superuser, non-BYPASSRLS role
 * has approved RLS policies and secure mail delivery configuration.
 * An admin/migration URL must not be used for the application. */
export async function identityRuntime():Promise<IdentityDependencies|null>{
 if(!requestedFeature('auth')||missingEnv(needed).length||!configuredAppOrigin())return null;
 const pool=getBookingPgPool();
 const connection=await pool.connect();
 try{
  const row=await connection.query<{superuser:boolean;bypassrls:boolean;can_login:boolean}>(`
   SELECT rolsuper AS superuser,rolbypassrls AS bypassrls,rolcanlogin AS can_login
   FROM pg_roles WHERE rolname=current_user LIMIT 1`);
  const role=row.rows[0];
  if(!role||role.superuser||role.bypassrls||!role.can_login)return null;
  const policy=await connection.query<{policy_count:number}>(`
    SELECT count(*)::int AS policy_count FROM pg_policies
    WHERE schemaname='booking_auth'`);
  if((policy.rows[0]?.policy_count??0)<10)return null;
  const membership=await connection.query<{permitted:boolean}>(`SELECT pg_has_role(current_user,'booking_identity_service','USAGE') AS permitted`);
  if(membership.rows[0]?.permitted!==true)return null;
 }finally{connection.release()}
 return {
  db:createPgIdentityRepository(pool,{rateKeySecret:process.env.AUTH_RATE_KEY_SECRET!}),
  pepper:process.env.AUTH_PASSWORD_PEPPER!,
  mailEncryptionKey:process.env.AUTH_MAIL_ENCRYPTION_KEY!,
  now:()=>new Date()
 };
}
