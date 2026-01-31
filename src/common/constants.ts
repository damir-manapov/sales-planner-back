/**
 * System-wide role names.
 * Use these constants instead of hardcoding role names to ensure consistency.
 */
export const ROLE_NAMES = {
  SYSTEM_ADMIN: 'systemAdmin',
  TENANT_ADMIN: 'tenantAdmin',
  TENANT_OWNER: 'tenantOwner', // Derived role, not stored in database
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];
