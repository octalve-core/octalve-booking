export type WorkspaceRole='owner'|'admin'|'manager'|'staff'|'viewer';
export type WorkspaceAction='view'|'manage_schedule'|'manage_clients'|'manage_services'|'manage_settings'|'invite_members'|'manage_billing'|'transfer_ownership';
export interface Identity {id:string;verified:boolean;disabled:boolean}
export interface Membership {userId:string;workspaceId:string;role:WorkspaceRole;status:'pending'|'active'|'suspended'|'removed'}
const allowed:Record<WorkspaceRole,ReadonlySet<WorkspaceAction>>={
 owner:new Set(['view','manage_schedule','manage_clients','manage_services','manage_settings','invite_members','manage_billing','transfer_ownership']),
 admin:new Set(['view','manage_schedule','manage_clients','manage_services','manage_settings','invite_members','manage_billing']),
 manager:new Set(['view','manage_schedule','manage_clients','manage_services']),
 staff:new Set(['view','manage_schedule','manage_clients']),
 viewer:new Set(['view'])
};
export function hasWorkspacePermission(identity:Identity|null,membership:Membership|null,workspaceId:string,action:WorkspaceAction):boolean{
 if(!identity||identity.disabled||!identity.verified||!membership||membership.userId!==identity.id||membership.workspaceId!==workspaceId||membership.status!=='active')return false;
 return allowed[membership.role]?.has(action)??false;
}
export function assertWorkspacePermission(identity:Identity|null,membership:Membership|null,workspaceId:string,action:WorkspaceAction):void{
 if(!hasWorkspacePermission(identity,membership,workspaceId,action))throw new Error('WORKSPACE_ACCESS_DENIED');
}
