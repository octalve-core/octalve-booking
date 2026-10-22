/** Platform authority and business workspace permissions are unrelated.
 * A workspace owner has zero implicit Octalve platform privileges. */
export type PlatformRole='platform_owner'|'platform_admin'|'finance'|'support'|'security'|'analyst';
export type PlatformAction='platform_view'|'manage_subscriptions'|'manage_tenants'|'manage_support'|'manage_security'|'manage_platform_roles'|'view_platform_finance';
export type PlatformMember={userId:string;role:PlatformRole;status:'active'|'suspended'|'revoked';mfaVerifiedAt:Date|null};
const permissions:Record<PlatformRole,ReadonlySet<PlatformAction>>={
 platform_owner:new Set(['platform_view','manage_subscriptions','manage_tenants','manage_support','manage_security','manage_platform_roles','view_platform_finance']),
 platform_admin:new Set(['platform_view','manage_subscriptions','manage_tenants','manage_support']),
 finance:new Set(['platform_view','manage_subscriptions','view_platform_finance']),
 support:new Set(['platform_view','manage_support']),
 security:new Set(['platform_view','manage_security']),
 analyst:new Set(['platform_view'])
};
export function hasPlatformPermission(userId:string|null,member:PlatformMember|null,action:PlatformAction):boolean{
 return !!userId&&!!member&&member.userId===userId&&member.status==='active'&&
   member.mfaVerifiedAt instanceof Date&&Number.isFinite(member.mfaVerifiedAt.getTime())&&
   (permissions[member.role]?.has(action)??false);
}
export function requirePlatformPermission(userId:string|null,member:PlatformMember|null,action:PlatformAction):void{
 if(!hasPlatformPermission(userId,member,action))throw new Error('PLATFORM_ACCESS_DENIED');
}
