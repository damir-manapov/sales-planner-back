import { describe, expect, it } from 'vitest';
import { CreateUserRoleSchema } from './user-roles.schema.js';

describe('UserRole Schemas', () => {
  describe('CreateUserRoleSchema', () => {
    it('should validate valid user role assignment', () => {
      const data = {
        user_id: 1,
        role_id: 2,
      };

      const result = CreateUserRoleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate with optional tenant_id', () => {
      const data = {
        user_id: 1,
        role_id: 2,
        tenant_id: 3,
      };

      const result = CreateUserRoleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate with optional shop_id', () => {
      const data = {
        user_id: 1,
        role_id: 2,
        shop_id: 4,
      };

      const result = CreateUserRoleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate with all optional fields', () => {
      const data = {
        user_id: 1,
        role_id: 2,
        tenant_id: 3,
        shop_id: 4,
      };

      const result = CreateUserRoleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject negative user_id', () => {
      const data = {
        user_id: -1,
        role_id: 2,
      };

      expect(() => CreateUserRoleSchema.parse(data)).toThrow();
    });

    it('should reject zero role_id', () => {
      const data = {
        user_id: 1,
        role_id: 0,
      };

      expect(() => CreateUserRoleSchema.parse(data)).toThrow();
    });

    it('should reject negative tenant_id', () => {
      const data = {
        user_id: 1,
        role_id: 2,
        tenant_id: -1,
      };

      expect(() => CreateUserRoleSchema.parse(data)).toThrow();
    });

    it('should reject zero shop_id', () => {
      const data = {
        user_id: 1,
        role_id: 2,
        shop_id: 0,
      };

      expect(() => CreateUserRoleSchema.parse(data)).toThrow();
    });

    it('should reject missing user_id', () => {
      const data = {
        role_id: 2,
      };

      expect(() => CreateUserRoleSchema.parse(data)).toThrow();
    });

    it('should reject missing role_id', () => {
      const data = {
        user_id: 1,
      };

      expect(() => CreateUserRoleSchema.parse(data)).toThrow();
    });
  });
});
