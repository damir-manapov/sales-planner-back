import { describe, expect, it } from 'vitest';
import {
  CreateTenantSchema,
  CreateTenantWithShopSchema,
  UpdateTenantSchema,
} from './tenants.schema.js';

describe('Tenant Schemas', () => {
  describe('CreateTenantSchema', () => {
    it('should validate valid tenant creation data', () => {
      const data = {
        title: 'Test Tenant',
        created_by: 1,
      };

      const result = CreateTenantSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate with optional owner_id', () => {
      const data = {
        title: 'Test Tenant',
        owner_id: 5,
        created_by: 1,
      };

      const result = CreateTenantSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty title', () => {
      const data = {
        title: '',
        created_by: 1,
      };

      expect(() => CreateTenantSchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters', () => {
      const data = {
        title: 'A'.repeat(256),
        created_by: 1,
      };

      expect(() => CreateTenantSchema.parse(data)).toThrow();
    });

    it('should reject negative owner_id', () => {
      const data = {
        title: 'Test Tenant',
        owner_id: -1,
        created_by: 1,
      };

      expect(() => CreateTenantSchema.parse(data)).toThrow();
    });

    it('should reject zero created_by', () => {
      const data = {
        title: 'Test Tenant',
        created_by: 0,
      };

      expect(() => CreateTenantSchema.parse(data)).toThrow();
    });

    it('should allow missing created_by (set by controller)', () => {
      const data = {
        title: 'Test Tenant',
      };

      const result = CreateTenantSchema.parse(data);
      expect(result).toEqual(data);
    });
  });

  describe('UpdateTenantSchema', () => {
    it('should validate partial update with title only', () => {
      const data = { title: 'New Title' };

      const result = UpdateTenantSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty object', () => {
      const data = {};

      const result = UpdateTenantSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow null owner_id', () => {
      const data = { owner_id: null };

      const result = UpdateTenantSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty title on update', () => {
      const data = { title: '' };

      expect(() => UpdateTenantSchema.parse(data)).toThrow();
    });
  });

  describe('CreateTenantWithShopSchema', () => {
    it('should validate valid tenant with shop creation data', () => {
      const data = {
        tenantTitle: 'Test Tenant',
        userEmail: 'user@example.com',
        userName: 'Test User',
      };

      const result = CreateTenantWithShopSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate with optional shopTitle', () => {
      const data = {
        tenantTitle: 'Test Tenant',
        shopTitle: 'Test Shop',
        userEmail: 'user@example.com',
        userName: 'Test User',
      };

      const result = CreateTenantWithShopSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject invalid email', () => {
      const data = {
        tenantTitle: 'Test Tenant',
        userEmail: 'not-an-email',
        userName: 'Test User',
      };

      expect(() => CreateTenantWithShopSchema.parse(data)).toThrow();
    });

    it('should reject empty userName', () => {
      const data = {
        tenantTitle: 'Test Tenant',
        userEmail: 'user@example.com',
        userName: '',
      };

      expect(() => CreateTenantWithShopSchema.parse(data)).toThrow();
    });

    it('should reject empty tenantTitle', () => {
      const data = {
        tenantTitle: '',
        userEmail: 'user@example.com',
        userName: 'Test User',
      };

      expect(() => CreateTenantWithShopSchema.parse(data)).toThrow();
    });
  });
});
