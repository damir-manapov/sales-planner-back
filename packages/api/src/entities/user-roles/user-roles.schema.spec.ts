import { describe, expect, it } from 'vitest';
import { CreateUserRoleSchema } from './user-roles.schema.js';

describe('UserRole Schemas', () => {
  describe('CreateUserRoleSchema', () => {
    it('should validate valid user role assignment', () => {
      const data = {
        userId: 1,
        roleId: 2,
      };

      const result = CreateUserRoleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate with optional tenantId', () => {
      const data = {
        userId: 1,
        roleId: 2,
        tenantId: 3,
      };

      const result = CreateUserRoleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate with optional shopId', () => {
      const data = {
        userId: 1,
        roleId: 2,
        shopId: 4,
      };

      const result = CreateUserRoleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate with all optional fields', () => {
      const data = {
        userId: 1,
        roleId: 2,
        tenantId: 3,
        shopId: 4,
      };

      const result = CreateUserRoleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject negative userId', () => {
      const data = {
        userId: -1,
        roleId: 2,
      };

      expect(() => CreateUserRoleSchema.parse(data)).toThrow();
    });

    it('should reject zero roleId', () => {
      const data = {
        userId: 1,
        roleId: 0,
      };

      expect(() => CreateUserRoleSchema.parse(data)).toThrow();
    });

    it('should reject negative tenantId', () => {
      const data = {
        userId: 1,
        roleId: 2,
        tenantId: -1,
      };

      expect(() => CreateUserRoleSchema.parse(data)).toThrow();
    });

    it('should reject zero shopId', () => {
      const data = {
        userId: 1,
        roleId: 2,
        shopId: 0,
      };

      expect(() => CreateUserRoleSchema.parse(data)).toThrow();
    });

    it('should reject missing userId', () => {
      const data = {
        roleId: 2,
      };

      expect(() => CreateUserRoleSchema.parse(data)).toThrow();
    });

    it('should reject missing roleId', () => {
      const data = {
        userId: 1,
      };

      expect(() => CreateUserRoleSchema.parse(data)).toThrow();
    });
  });
});
