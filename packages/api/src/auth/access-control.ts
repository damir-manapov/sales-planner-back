import { ForbiddenException } from '@nestjs/common';
import { ROLE_NAMES } from '../common/constants.js';
import { AuthenticatedRequest } from './auth.guard.js';

type User = AuthenticatedRequest['user'];

function getShopRoles(user: User, shopId: number): string[] {
  const shopRole = user.shopRoles.find((sr) => sr.shopId === shopId);
  return shopRole?.roles || [];
}

function getTenantRoles(user: User, tenantId: number): string[] {
  const tenantRole = user.tenantRoles.find((tr) => tr.tenantId === tenantId);
  return tenantRole?.roles || [];
}

export function isTenantAdmin(user: User, tenantId: number): boolean {
  const tenantRoles = getTenantRoles(user, tenantId);
  return tenantRoles.includes(ROLE_NAMES.TENANT_ADMIN);
}

export function isTenantOwner(user: User, tenantId: number): boolean {
  return user.ownedTenantIds.includes(tenantId);
}

/** Check if user has tenant-level access (owner or admin) */
export function hasTenantAccess(user: User, tenantId: number): boolean {
  return isTenantOwner(user, tenantId) || isTenantAdmin(user, tenantId);
}

/** Check if user is system admin or has tenant access */
export function hasAdminAccess(user: User, tenantId?: number): boolean {
  if (user.isSystemAdmin) return true;
  if (tenantId) return hasTenantAccess(user, tenantId);
  return false;
}

/** Validate that user has admin access to the tenant */
export function validateTenantAdminAccess(user: User, tenantId: number): void {
  if (user.isSystemAdmin) return;
  if (!hasTenantAccess(user, tenantId)) {
    throw new ForbiddenException('Tenant owner or admin access required');
  }
}

export function hasReadAccess(user: User, shopId: number, tenantId: number): boolean {
  if (hasTenantAccess(user, tenantId)) {
    return true;
  }
  const shopRoles = getShopRoles(user, shopId);
  return shopRoles.includes(ROLE_NAMES.VIEWER) || shopRoles.includes(ROLE_NAMES.EDITOR);
}

export function hasWriteAccess(user: User, shopId: number, tenantId: number): boolean {
  if (hasTenantAccess(user, tenantId)) {
    return true;
  }
  const shopRoles = getShopRoles(user, shopId);
  return shopRoles.includes(ROLE_NAMES.EDITOR);
}

export function validateReadAccess(user: User, shopId: number, tenantId: number): void {
  if (!user.tenantIds.includes(tenantId)) {
    throw new ForbiddenException('Access to this tenant is not allowed');
  }
  if (!hasReadAccess(user, shopId, tenantId)) {
    throw new ForbiddenException('Viewer or editor role required for this shop');
  }
}

export function validateWriteAccess(user: User, shopId: number, tenantId: number): void {
  if (!user.tenantIds.includes(tenantId)) {
    throw new ForbiddenException('Access to this tenant is not allowed');
  }
  if (!hasWriteAccess(user, shopId, tenantId)) {
    throw new ForbiddenException('Editor role required for this shop');
  }
}
