import {createHmac,randomUUID} from 'node:crypto';
import type {IdentityRepository,EventType,SignupProfile,LoginRecord,Principal,TokenRecord,AccountProfile} from './contracts.ts';

/** Minimal structural adapter compatible with a Node PostgreSQL driver's Pool.connect().
 * The real driver, TLS, credentials and runtime role are injected after provisioning.
 * No network connection is created by importing this module. */
export interface PgQueryResult<Row> {rows:Row[];rowCount:number|null}
export interface PgConnection {
 query<Row=Record<string,unknown>>(text:string,values?:unknown[]):Promise<PgQueryResult<Row>>;
 release():void;
}
export interface PgPool {connect():Promise<PgConnection>}
type IdentityConfig={rateKeySecret:string};
async function enqueueNotice(db:PgConnection,notice:{kind:'verification'|'password-reset';recipient:string;sealedToken:string;expiresAt:Date},at:Date):Promise<void>{
 if(!notice.recipient||!notice.sealedToken.startsWith('v1.')||!isValidDate(notice.expiresAt)||notice.expiresAt<=at)throw new Error('INVALID_OUTBOX_NOTICE');
 await db.query(`INSERT INTO booking_auth.mail_outbox(recipient,kind,sealed_token,token_expires_at,created_at,not_before)
 VALUES($1,$2,$3,$4,$5,$5)`,[notice.recipient,notice.kind,notice.sealedToken,notice.expiresAt,at]);
}
const rateLimits:Record<EventType,{max:number;windowMinutes:number}>={
 register:{max:5,windowMinutes:60},
 verify:{max:10,windowMinutes:15},
 resend:{max:3,windowMinutes:60},
 login:{max:10,windowMinutes:15},
 recover:{max:3,windowMinutes:60},
 reset:{max:6,windowMinutes:15}
};
function atLeast32(s:string,label:string):void{
 if(typeof s!=='string'||Buffer.byteLength(s,'utf8')<32)throw new Error(label+'_NOT_CONFIGURED');
}
async function withTx<T>(pool:PgPool,work:(db:PgConnection)=>Promise<T>):Promise<T>{
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  try{const result=await work(client);await client.query('COMMIT');return result}
  catch(error){try{await client.query('ROLLBACK')}catch{}throw error}
 }finally{client.release()}
}
function workspaceSlug():string{return 'workspace-'+randomUUID().replaceAll('-','')}
function isValidDate(value:Date):boolean{return value instanceof Date&&Number.isFinite(value.getTime())}
function validDigest(digest:string):boolean{return /^[a-f0-9]{64}$/.test(digest)}
function checkedDate(value:Date):void{if(!isValidDate(value))throw new Error('INVALID_AUTH_DATE')}
function checkedToken(token:TokenRecord):void{
 if(!validDigest(token.digest)||!isValidDate(token.expiresAt))throw new Error('INVALID_AUTH_TOKEN');
}
function maxRow<T>(rows:T[],label:string):T|null{
 if(rows.length>1)throw new Error('INCONSISTENT_'+label);
 return rows[0]??null;
}
type DbUser={id:string;password_digest:string|null;verified:boolean;disabled:boolean};
type DbPrincipal={user_id:string;verified:boolean;disabled:boolean};

/** The runtime PostgreSQL role requires explicit, audited RLS access policies.
 * With 001/002 alone every query fails closed due to FORCE RLS.
 * Do not grant BYPASSRLS to a public/request-facing role. */
export function createPgIdentityRepository(pool:PgPool,config:IdentityConfig):IdentityRepository {
 atLeast32(config.rateKeySecret,'RATE_KEY_SECRET');
 return {
  async allowAttempt({event,key,at}){
   checkedDate(at);
   const rule=rateLimits[event];
   if(!rule||typeof key!=='string'||key.length>512||key.length===0)return false;
   const digest=createHmac('sha256',config.rateKeySecret).update(event+'\0'+key).digest('hex');
   const windowMs=rule.windowMinutes*60_000;
   const oldThreshold=new Date(at.getTime()-windowMs);
   const result=await withTx(pool,async db=>db.query<{attempts:number}>(`
     INSERT INTO booking_auth.rate_limits (rate_key,window_started,attempts)
     VALUES ($1,$2,1)
     ON CONFLICT (rate_key) DO UPDATE SET
       window_started=CASE WHEN rate_limits.window_started <= $3
         THEN EXCLUDED.window_started ELSE rate_limits.window_started END,
       attempts=CASE WHEN rate_limits.window_started <= $3
         THEN 1 ELSE rate_limits.attempts+1 END
     RETURNING attempts
   `,[digest,at,oldThreshold]));
   return (result.rows[0]?.attempts??Number.POSITIVE_INFINITY)<=rule.max;
  },
  async createPending({profile,passwordDigest,verification,notice,at}){
   checkedDate(at);checkedToken(verification);
   return withTx(pool,async db=>{
    const made=await db.query<{id:string}>(`
      INSERT INTO booking_auth.users(email,full_name,phone_e164,password_digest,created_at,updated_at)
      VALUES($1,$2,$3,$4,$5,$5)
      ON CONFLICT (email) DO NOTHING RETURNING id
    `,[profile.email,profile.fullName,profile.phoneE164??null,passwordDigest,at]);
    const user=maxRow(made.rows,'USER_INSERT');
    if(!user)return 'exists';
    const workspace=await db.query<{id:string}>(`
      INSERT INTO booking_auth.workspaces(name,slug,kind,timezone,currency,created_at,website)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id
    `,[profile.businessName??(profile.fullName+' Workspace'),workspaceSlug(),profile.kind,profile.timezone??'Africa/Lagos',profile.currency??'NGN',at,profile.website??null]);
    const w=maxRow(workspace.rows,'WORKSPACE_INSERT');
    if(!w)throw new Error('WORKSPACE_INSERT_FAILED');
    await db.query(`
      INSERT INTO booking_auth.memberships(workspace_id,user_id,role,status,created_at,updated_at)
      VALUES($1,$2,'owner','pending',$3,$3)
    `,[w.id,user.id,at]);
    await db.query(`
      INSERT INTO booking_auth.one_time_tokens(user_id,purpose,token_digest,expires_at,created_at)
      VALUES($1,'email-verification',$2,$3,$4)
    `,[user.id,verification.digest,verification.expiresAt,at]);
    await enqueueNotice(db,notice,at);
    return 'created';
   });
  },
  async resend({email,verification,notice,at}){
   checkedDate(at);checkedToken(verification);
   return withTx(pool,async db=>{
    const users=await db.query<{id:string}>(`
      SELECT id FROM booking_auth.users
      WHERE email=$1 AND verified_at IS NULL AND disabled_at IS NULL FOR UPDATE
    `,[email]);
    const user=maxRow(users.rows,'PENDING_USER');if(!user)return false;
    await db.query(`
      UPDATE booking_auth.one_time_tokens SET consumed_at=$2
      WHERE user_id=$1 AND purpose='email-verification' AND consumed_at IS NULL
    `,[user.id,at]);
    await db.query(`
      INSERT INTO booking_auth.one_time_tokens(user_id,purpose,token_digest,expires_at,created_at)
      VALUES($1,'email-verification',$2,$3,$4)
    `,[user.id,verification.digest,verification.expiresAt,at]);
    await enqueueNotice(db,notice,at);
    return true;
   });
  },
  async consumeVerification({digest,at}){
   checkedDate(at);if(!validDigest(digest))return false;
   return withTx(pool,async db=>{
    const tokens=await db.query<{id:string;user_id:string}>(`
      SELECT id,user_id FROM booking_auth.one_time_tokens
      WHERE token_digest=$1 AND purpose='email-verification'
        AND consumed_at IS NULL AND expires_at>$2 FOR UPDATE
    `,[digest,at]);
    const token=maxRow(tokens.rows,'VERIFICATION_TOKEN');if(!token)return false;
    const users=await db.query<{id:string}>(`
      SELECT id FROM booking_auth.users WHERE id=$1 AND disabled_at IS NULL FOR UPDATE
    `,[token.user_id]);
    if(!maxRow(users.rows,'VERIFICATION_USER'))return false;
    await db.query('UPDATE booking_auth.one_time_tokens SET consumed_at=$2 WHERE id=$1',[token.id,at]);
    await db.query('UPDATE booking_auth.users SET verified_at=COALESCE(verified_at,$2),updated_at=$2 WHERE id=$1',[token.user_id,at]);
    await db.query(`
      UPDATE booking_auth.memberships SET status='active',updated_at=$2
      WHERE user_id=$1 AND role='owner' AND status='pending'
    `,[token.user_id,at]);
    return true;
   });
  },
  async getCredentials(email):Promise<LoginRecord|null>{
   return withTx(pool,async db=>{
    const found=await db.query<DbUser>(`
      SELECT id,password_digest,verified_at IS NOT NULL AS verified,disabled_at IS NOT NULL AS disabled
      FROM booking_auth.users WHERE email=$1
    `,[email]);
    const u=maxRow(found.rows,'CREDENTIALS');
    return u?{userId:u.id,passwordDigest:u.password_digest,verified:u.verified,disabled:u.disabled}:null;
   });
  },
  async getAccountProfile(userId):Promise<AccountProfile|null>{
   return withTx(pool,async db=>{
    const user=await db.query<{id:string;full_name:string;email:string;phone_e164:string|null}>(`
     SELECT id,full_name,email::text,phone_e164 FROM booking_auth.users
     WHERE id=$1 AND verified_at IS NOT NULL AND disabled_at IS NULL
    `,[userId]);
    if(user.rows.length!==1)return null;
    const workspaces=await db.query<{id:string;name:string;kind:'individual'|'business';role:string;timezone:string;currency:string;website:string|null}>(`
     SELECT w.id,w.name,w.kind,m.role,w.timezone,w.currency,w.website
     FROM booking_auth.memberships m JOIN booking_auth.workspaces w ON w.id=m.workspace_id
     WHERE m.user_id=$1 AND m.status='active' ORDER BY w.created_at ASC
    `,[userId]);
    const u=user.rows[0];
    return {userId:u.id,fullName:u.full_name,email:u.email,phoneE164:u.phone_e164,workspaces:workspaces.rows};
   });
  },
  async updateAccountProfile({userId,patch,at}){
   checkedDate(at);
   return withTx(pool,async db=>{
    const updated=await db.query<{id:string}>(`
     UPDATE booking_auth.users SET
       full_name=COALESCE($2,full_name),
       phone_e164=CASE WHEN $4::boolean THEN $3 ELSE phone_e164 END,
       updated_at=$5
     WHERE id=$1 AND verified_at IS NOT NULL AND disabled_at IS NULL
     RETURNING id
    `,[userId,patch.fullName??null,patch.phoneE164??null,Object.hasOwn(patch,'phoneE164'),at]);
    if(updated.rows.length!==1)return false;
    await db.query(`INSERT INTO booking_auth.auth_events(user_id,event_type,occurred_at)
      VALUES($1,'profile_updated',$2)`,[userId,at]);
    return true;
   });
  },
  async updateBusinessIdentity({userId,workspaceId,patch,at}){
   checkedDate(at);
   return withTx(pool,async db=>{
    const r=await db.query<{id:string}>(`
     UPDATE booking_auth.workspaces w SET
       name=COALESCE($3,w.name),
       website=CASE WHEN $7::boolean THEN $4 ELSE w.website END,
       timezone=COALESCE($5,w.timezone),
       currency=COALESCE($6,w.currency),
       updated_at=$8
     WHERE w.id=$2 AND EXISTS(
       SELECT 1 FROM booking_auth.memberships m
       JOIN booking_auth.users u ON u.id=m.user_id
       WHERE m.workspace_id=w.id AND m.user_id=$1 AND m.role='owner'
         AND m.status='active' AND u.disabled_at IS NULL AND u.verified_at IS NOT NULL
     )
     RETURNING id
    `,[userId,workspaceId,patch.name??null,patch.website??null,patch.timezone??null,patch.currency??null,Object.hasOwn(patch,'website'),at]);
    if(r.rows.length!==1)return false;
    await db.query(`INSERT INTO booking_auth.auth_events(user_id,workspace_id,event_type,occurred_at)
     VALUES($1,$2,'business_identity_updated',$3)`,[userId,workspaceId,at]);
    return true;
   });
  },
  async changePassword({userId,expectedDigest,newDigest,at}){
   checkedDate(at);
   if(!newDigest.startsWith('booking-scrypt-v1'+String.fromCharCode(36)))return false;
   return withTx(pool,async db=>{
    const updated=await db.query<{id:string}>(`
     UPDATE booking_auth.users SET password_digest=$3,updated_at=$4
     WHERE id=$1 AND password_digest=$2 AND disabled_at IS NULL AND verified_at IS NOT NULL
     RETURNING id
    `,[userId,expectedDigest,newDigest,at]);
    if(updated.rows.length!==1)return false;
    await db.query(`UPDATE booking_auth.sessions SET revoked_at=$2
      WHERE user_id=$1 AND revoked_at IS NULL`,[userId,at]);
    await db.query(`INSERT INTO booking_auth.auth_events(user_id,event_type,occurred_at)
      VALUES($1,'password_changed',$2)`,[userId,at]);
    return true;
   });
  },
  async createSession({userId,digest,expiresAt,at}){
   checkedDate(at);checkedDate(expiresAt);if(!validDigest(digest)||expiresAt<=at)return false;
   return withTx(pool,async db=>{
    const r=await db.query<{id:string}>(`
      INSERT INTO booking_auth.sessions(user_id,token_digest,created_at,expires_at)
      SELECT id,$2,$3,$4 FROM booking_auth.users
      WHERE id=$1 AND verified_at IS NOT NULL AND disabled_at IS NULL
      RETURNING id
    `,[userId,digest,at,expiresAt]);
    return r.rows.length===1;
   });
  },
  async getSession({digest,at}):Promise<Principal|null>{
   checkedDate(at);if(!validDigest(digest))return null;
   return withTx(pool,async db=>{
    const r=await db.query<DbPrincipal>(`
      SELECT u.id AS user_id,
        u.verified_at IS NOT NULL AS verified,
        u.disabled_at IS NOT NULL AS disabled
      FROM booking_auth.sessions s
      JOIN booking_auth.users u ON u.id=s.user_id
      WHERE s.token_digest=$1 AND s.revoked_at IS NULL AND s.expires_at>$2
    `,[digest,at]);
    const u=maxRow(r.rows,'SESSION');
    return u?{userId:u.user_id,verified:u.verified,disabled:u.disabled}:null;
   });
  },
  async revokeSession({digest,at}){
   checkedDate(at);if(!validDigest(digest))return;
   await withTx(pool,db=>db.query(`
     UPDATE booking_auth.sessions SET revoked_at=$2 WHERE token_digest=$1 AND revoked_at IS NULL
   `,[digest,at]).then(()=>undefined));
  },
  async beginReset({email,token,notice,at}){
   checkedDate(at);checkedToken(token);
   return withTx(pool,async db=>{
    const users=await db.query<{id:string}>(`
      SELECT id FROM booking_auth.users
      WHERE email=$1 AND verified_at IS NOT NULL AND disabled_at IS NULL FOR UPDATE
    `,[email]);
    const user=maxRow(users.rows,'RECOVERY_USER');if(!user)return false;
    await db.query(`
      UPDATE booking_auth.one_time_tokens SET consumed_at=$2
      WHERE user_id=$1 AND purpose='password-reset' AND consumed_at IS NULL
    `,[user.id,at]);
    await db.query(`
      INSERT INTO booking_auth.one_time_tokens(user_id,purpose,token_digest,expires_at,created_at)
      VALUES($1,'password-reset',$2,$3,$4)
    `,[user.id,token.digest,token.expiresAt,at]);
    await enqueueNotice(db,notice,at);
    return true;
   });
  },
  async completeReset({digest,passwordDigest,at}){
   checkedDate(at);if(!validDigest(digest)||!passwordDigest.startsWith('booking-scrypt-v1$'))return false;
   return withTx(pool,async db=>{
    const tok=await db.query<{id:string;user_id:string}>(`
      SELECT id,user_id FROM booking_auth.one_time_tokens
      WHERE token_digest=$1 AND purpose='password-reset'
        AND consumed_at IS NULL AND expires_at>$2 FOR UPDATE
    `,[digest,at]);
    const t=maxRow(tok.rows,'RESET_TOKEN');if(!t)return false;
    const user=await db.query<{id:string}>(`
      SELECT id FROM booking_auth.users
      WHERE id=$1 AND verified_at IS NOT NULL AND disabled_at IS NULL FOR UPDATE
    `,[t.user_id]);
    if(!maxRow(user.rows,'RESET_USER'))return false;
    await db.query('UPDATE booking_auth.users SET password_digest=$2,updated_at=$3 WHERE id=$1',
      [t.user_id,passwordDigest,at]);
    await db.query('UPDATE booking_auth.one_time_tokens SET consumed_at=$2 WHERE id=$1',[t.id,at]);
    await db.query(`
      UPDATE booking_auth.sessions SET revoked_at=$2
      WHERE user_id=$1 AND revoked_at IS NULL
    `,[t.user_id,at]);
    return true;
   });
  }
 };
}
