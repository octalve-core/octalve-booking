import {Pool} from 'pg';
import type {PgPool,PgConnection,PgQueryResult} from './postgres.ts';

let instance:Pool|undefined;
function requireConnectionString():string{
 const value=process.env.DATABASE_URL;
 if(!value)throw new Error('BOOKING_DATABASE_NOT_CONFIGURED');
 let url:URL;
 try{url=new URL(value)}catch{throw new Error('BOOKING_DATABASE_INVALID_URL')}
 if(!['postgresql:','postgres:'].includes(url.protocol)||!url.hostname||!url.username||!url.password)throw new Error('BOOKING_DATABASE_INVALID_URL');
 if(url.searchParams.get('sslmode')!=='require'&&url.searchParams.get('sslmode')!=='verify-full')throw new Error('BOOKING_DATABASE_TLS_REQUIRED');
 return value;
}
export function getBookingPgPool():PgPool{
 if(!instance)instance=new Pool({
  connectionString:requireConnectionString(),
  max:4,
  connectionTimeoutMillis:5000,
  idleTimeoutMillis:10000,
  ssl:{rejectUnauthorized:true}
 });
 const pool=instance;
 return {
  async connect():Promise<PgConnection>{
   const client=await pool.connect();
   return {
    async query<Row=Record<string,unknown>>(sql:string,values?:unknown[]):Promise<PgQueryResult<Row>>{
      const result=await client.query(sql,values);
      return {rows:result.rows as Row[],rowCount:result.rowCount};
    },
    release(){client.release()}
   };
  }
 };
}
