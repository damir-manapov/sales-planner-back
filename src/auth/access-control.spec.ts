import { describe, it, expect } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import {
  hasTenantAccess,
  hasAdminAccess,
  validateTenantAdminAccess,
  isTenantAdmin,
  isTenantOwner,
  hasReadAccess,
  hasWriteAccess,
  validateReadAccess,
  validateWriteAccess,
} from './access-control.js';
import type { AuthenticatedUser } from './auth.guard.js';

function createUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    tenantIds: [],
    ownedTenantIds: [],
    tenantRoles: [],
    shopRoles: [],
    isSystemAdmin: false,
    ...overrides,
  };
}

describe('access-control', () => {
  describe('isTenantOwner', () => {
    it('returns true if user owns the tenant', () => {
      const user = createUser({ ownedTenantIds: [1, 2] });
      expect(isTenantOwner(user, 1)).toBe(true);
      expect(isTenantOwner(user, 2)).toBe(true);
    });

    it('returns false if user does not own the tenant', () => {
      const user = createUser({ ownedTenantIds: [1] });
      expect(isTenantOwner(user, 2)).toBe(false);
    });
  });

  describe('isTenantAdmin', () => {
    it('returns true if user has tenantAdmin role for tenant', () => {
      const user = createUser({
        tenantRoles: [{ tenantId: 1, roles: ['tenantAdmin'] }],
      });
      expect(isTenantAdmin(user, 1)).toBe(true);
    });

    it('returns false if user does not have tenantAdmin role', () => {
      const user = createUser({
        tenantRoles: [{ tenantId: 1, roles: ['viewer'] }],
      });
      expect(isTenantAdmin(user, 1)).toBe(false);
    });

    it('returns false for different tenant', () => {
      const user = createUser({
        tenantRoles: [{ tenantId: 1, roles: ['tenantAdmin'] }],
      });
      expect(isTenantAdmin(user, 2)).toBe(false);
    });
  });

  describe('hasTenantAccess', () => {
    it('returns true for tenant owner', () => {
      const user = createUser({ ownedTenantIds: [1] });
      expect(hasTenantAccess(user, 1)).toBe(true);
    });

    it('returns true for tenant admin', () => {
      const user = createUser({
        tenantRoles: [{ tenantId: 1, roles: ['tenantAdmin'] }],
      });
      expect(hasTenantAccess(user, 1)).toBe(true);
    });

    it('returns false for regular user', () => {
      const user = createUser({
        tenantIds: [1],
        tenantRoles: [{ tenantId: 1, roles: ['viewer'] }],
      });
      expect(hasTenantAccess(user, 1)).toBe(false);
    });
  });

  describe('hasAdminAccess', () => {
    it('returns true for system admin', () => {
      const user = createUser({ isSystemAdmin: true });
      expect(hasAdminAccess(user)).toBe(true);
      expect(hasAdminAccess(user, 1)).toBe(true);
    });

    it('returns true for tenant admin with matching tenant', () => {
      const user = createUser({
        tenantRoles: [{ tenantId: 1, roles: ['tenantAdmin'] }],
      });
      expect(hasAdminAccess(user, 1)).toBe(true);
    });

    it('returns false for tenant admin without matching tenant', () => {
      const user = createUser({
        tenantRoles: [{ tenantId: 1, roles: ['tenantAdmin'] }],
      });
      expect(hasAdminAccess(user, 2)).toBe(false);
    });

    it('returns false for regular user', () => {
      const user = createUser({ tenantIds: [1] });
      expect(hasAdminAccess(user, 1)).toBe(false);
    });
  });

  describe('validateTenantAdminAccess', () => {
    it('does not throw for system admin', () => {
      const user = createUser({ isSystemAdmin: true });
      expect(() => validateTenantAdminAccess(user, 1)).not.toThrow();
    });

    it('does not throw for tenant owner', () => {
      const user = createUser({ ownedTenantIds: [1] });
      expect(() => validateTenantAdminAccess(user, 1)).not.toThrow();
    });

    it('does not throw for tenant admin', () => {
      const user = createUser({
        tenantRoles: [{ tenantId: 1, roles: ['tenantAdmin'] }],
      });
      expect(() => validateTenantAdminAccess(user, 1)).not.toThrow();
    });

    it('throws ForbiddenException for regular user', () => {
      const user = createUser({ tenantIds: [1] });
      expect(() => validateTenantAdminAccess(user, 1)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for wrong tenant', () => {
      const user = createUser({ ownedTenantIds: [1] });
      expect(() => validateTenantAdminAccess(user, 2)).toThrow(ForbiddenException);
    });
  });

  describe('hasReadAccess', () => {
    it('returns true for tenant owner', () => {
      const user = createUser({ ownedTenantIds: [1] });
      expect(hasReadAccess(user, 10, 1)).toBe(true);
    });

    it('returns true for shop viewer', () => {
      const user = createUser({
        shopRoles: [{ shopId: 10, roles: ['viewer'] }],
      });
      expect(hasReadAccess(user, 10, 1)).toBe(true);
    });

    it('returns true for shop editor', () => {
      const user = createUser({
        shopRoles: [{ shopId: 10, roles: ['editor'] }],
      });
      expect(hasReadAccess(user, 10, 1)).toBe(true);
    });

    it('returns false for user without any role', () => {
      const user = createUser();
      expect(hasReadAccess(user, 10, 1)).toBe(false);
    });
  });

  describe('hasWriteAccess', () => {
    it('returns true for tenant owner', () => {
      const user = createUser({ ownedTenantIds: [1] });
      expect(hasWriteAccess(user, 10, 1)).toBe(true);
    });

    it('returns true for shop editor', () => {
      const user = createUser({
        shopRoles: [{ shopId: 10, roles: ['editor'] }],
      });
      expect(hasWriteAccess(user, 10, 1)).toBe(true);
    });

    it('returns false for shop viewer', () => {
      const user = createUser({
        shopRoles: [{ shopId: 10, roles: ['viewer'] }],
      });
      expect(hasWriteAccess(user, 10, 1)).toBe(false);
    });
  });

  describe('validateReadAccess', () => {
    it('throws if user not in tenant', () => {
      const user = createUser({ tenantIds: [] });
      expect(() => validateReadAccess(user, 10, 1)).toThrow(ForbiddenException);
    });

    it('throws if no read access to shop', () => {
      const user = createUser({ tenantIds: [1] });
      expect(() => validateReadAccess(user, 10, 1)).toThrow(ForbiddenException);
    });

    it('does not throw for tenant owner', () => {
      const user = createUser({ tenantIds: [1], ownedTenantIds: [1] });
      expect(() => validateReadAccess(user, 10, 1)).not.toThrow();
    });
  });

  describe('validateWriteAccess', () => {
    it('throws if user not in tenant', () => {
      const user = createUser({ tenantIds: [] });
      expect(() => validateWriteAccess(user, 10, 1)).toThrow(ForbiddenException);
    });

    it('throws if only viewer access', () => {
      const user = createUser({
        tenantIds: [1],
        shopRoles: [{ shopId: 10, roles: ['viewer'] }],
      });
      expect(() => validateWriteAccess(user, 10, 1)).toThrow(ForbiddenException);
    });

    it('does not throw for editor', () => {
      const user = createUser({
        tenantIds: [1],
        shopRoles: [{ shopId: 10, roles: ['editor'] }],
      });
      expect(() => validateWriteAccess(user, 10, 1)).not.toThrow();
    });
  });
});
