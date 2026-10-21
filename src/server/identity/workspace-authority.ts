import {cookies} from 'next/headers';
import {SESSION_COOKIE} from './security.ts';
import {currentSession} from './service.ts';
import {assertWorkspacePermission} from './policy.ts';
import type {WorkspaceAction,Membership} from './policy.ts';
import type {IdentityDependencies} from './contracts.ts';
import type {PgPool} from './postgres.ts';

export interface MembershipReader {
 getMembership(userId:string,workspaceId:string):Promise<Membership|null>;
}

/** Server-only workspace guard. The userId comes from the verified, unexpired
 * __Host session cookie, NEVER from a URL, client role claim or request body.
 * Call before reading or mutating any tenant-scoped record. */
export async function requireWorkspaceMember(
 deps:IdentityDependencies, reader:MembershipReader, workspaceId:string,action:WorkspaceAction
):Promise<{userId:string;workspaceId:string}> {
 if(!(/^[0-9a-f-]{36}$/i.test(workspaceId)))throw new Error('WORKSPACE_ACCESS_DENIED');
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token)throw new Error('AUTH_REQUIRED');
 const user=await currentSession(deps,token);
 if(!user)throw new Error('AUTH_REQUIRED');
 const membership=await reader.getMembership(user.userId,workspaceId);
 // Session validation already rechecks verified / active users in DB.
 assertWorkspacePermission({id:user.userId,verified:true,disabled:false},membership,workspaceId,action);
 return {userId:user.userId,workspaceId};
}
export function createPgMembershipReader(pool:PgPool):MembershipReader {
 return {async getMembership(userId,workspaceId){
  const db=await pool.connect();
  try{
   const result=await db.query<{user_id:string;workspace_id:string;role:Membership['role'];status:Membership['status']}>(`
    SELECT user_id,workspace_id,role,status
    FROM booking_auth.memberships
    WHERE user_id=$1 AND workspace_id=$2 AND status='active' LIMIT 1
   `,[userId,workspaceId]);
   const m=result.rows[0];
   return m?{userId:m.user_id,workspaceId:m.workspace_id,role:m.role,status:m.status}:null;
  }finally{db.release()}
 }};
}
