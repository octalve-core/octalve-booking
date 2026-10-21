import type {PgPool,PgConnection} from './postgres.ts';
import {unsealMailToken} from './mail-crypto.ts';
import type {MailKind} from './mail-crypto.ts';

type Claimed={id:string;lease_id:string;recipient:string;kind:MailKind;sealed_token:string;token_expires_at:Date;attempts:number};
export interface AuthMailTransport {
 /** The provider should honour the stable message ID as an idempotency key, if available. */
 deliver(input:{idempotencyKey:string;to:string;kind:MailKind;token:string}):Promise<void>;
}
export interface OutboxResult {claimed:number;delivered:number;retried:number;expired:number}
export type OutboxSettings={mailEncryptionKey:string;batchSize?:number;maxAttempts?:number;now?:()=>Date};

/** Can be invoked only by an authenticated backend job/worker, never a public request.
 * Delivery is AT LEAST ONCE (a worker can crash after sending but before marking success). */
export async function dispatchAuthOutbox(pool:PgPool,transport:AuthMailTransport,options:OutboxSettings):Promise<OutboxResult>{
 const at=options.now?.()??new Date();
 if(!Number.isFinite(at.getTime()))throw new Error('INVALID_WORKER_CLOCK');
 const limit=Math.min(25,Math.max(1,options.batchSize??10));
 const maxAttempts=Math.min(20,Math.max(1,options.maxAttempts??8));
 const client=await pool.connect();
 let jobs:Claimed[]=[];
 try{
  await client.query('BEGIN');
  try{
   const result=await client.query<Claimed>(`
    WITH candidates AS (
      SELECT id FROM booking_auth.mail_outbox
      WHERE status IN ('pending','processing')
        AND not_before<=$1 AND (leased_until IS NULL OR leased_until<=$1)
        AND token_expires_at>$1 AND attempts<$2
      ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT $3
    )
    UPDATE booking_auth.mail_outbox AS mail SET
      status='processing',lease_id=gen_random_uuid(),
      leased_until=$1+interval '90 seconds',attempts=mail.attempts+1
    FROM candidates WHERE mail.id=candidates.id
    RETURNING mail.id,mail.lease_id,mail.recipient,mail.kind,
      mail.sealed_token,mail.token_expires_at,mail.attempts
   `,[at,maxAttempts,limit]);
   jobs=result.rows;
   await client.query('COMMIT');
  }catch(error){await client.query('ROLLBACK');throw error}
 }finally{client.release()}
 const outcomes:OutboxResult={claimed:jobs.length,delivered:0,retried:0,expired:0};
 for(const job of jobs){
  const ts=options.now?.()??new Date();
  let delivered=false,expired=job.token_expires_at<=ts;
  if(!expired){
   try{
    const token=unsealMailToken(options.mailEncryptionKey,job.kind,job.recipient,job.sealed_token);
    await transport.deliver({idempotencyKey:job.id,to:job.recipient,kind:job.kind,token});
    delivered=true;
   }catch{/* No tokens, provider response or exception messages enter logs/outbox. */}
  }
  const state=await pool.connect();
  try{
   const now=options.now?.()??new Date();
   if(delivered){
    await state.query(`
      UPDATE booking_auth.mail_outbox SET status='delivered',delivered_at=$3,
       leased_until=NULL,lease_id=NULL,last_error_code=NULL
      WHERE id=$1 AND lease_id=$2 AND status='processing'
    `,[job.id,job.lease_id,now]);
    outcomes.delivered++;
   }else if(expired||job.attempts>=maxAttempts||job.token_expires_at<=now){
    await state.query(`
      UPDATE booking_auth.mail_outbox SET status='exhausted',
       leased_until=NULL,lease_id=NULL,last_error_code=$3
      WHERE id=$1 AND lease_id=$2 AND status='processing'
    `,[job.id,job.lease_id,expired||job.token_expires_at<=now?'TOKEN_EXPIRED':'RETRY_EXHAUSTED']);
    outcomes.expired++;
   }else{
    // Exponential retry, bounded to 30 minutes.
    const delayMs=Math.min(30*60_000,2**Math.min(job.attempts,10)*30_000);
    await state.query(`
      UPDATE booking_auth.mail_outbox SET status='pending',leased_until=NULL,
        lease_id=NULL,not_before=$3,last_error_code='DELIVERY_RETRY'
      WHERE id=$1 AND lease_id=$2 AND status='processing'
    `,[job.id,job.lease_id,new Date(now.getTime()+delayMs)]);
    outcomes.retried++;
   }
  }finally{state.release()}
 }
 return outcomes;
}

/** Cleanup/reconciliation must run in a trusted scheduled job and record alarms.
 * Encrypted queue messages older than their token TTL should be exhausted/retained
 * for short, approved audit windows—not silently sent after expiration. */
export async function expireAuthOutbox(pool:PgPool,at=new Date()):Promise<number>{
 if(!Number.isFinite(at.getTime()))throw new Error('INVALID_WORKER_CLOCK');
 const connection=await pool.connect();
 try{
  const r=await connection.query(`
   UPDATE booking_auth.mail_outbox
   SET status='exhausted',lease_id=NULL,leased_until=NULL,last_error_code='TOKEN_EXPIRED'
   WHERE status IN ('pending','processing') AND token_expires_at<=$1
  `,[at]);
  return r.rowCount??0;
 }finally{connection.release()}
}
