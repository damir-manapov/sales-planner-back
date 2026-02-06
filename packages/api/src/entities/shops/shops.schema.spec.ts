import { describe, expect, it } from 'vitest';
import { CreateShopSchema, UpdateShopSchema } from './shops.schema.js';

describe('Shop Schemas', () => {
  describe('CreateShopSchema', () => {
    it('should validate valid shop creation data', () => {
      const data = {
        title: 'Test Shop',
        tenant_id: 1,
      };

      const result = CreateShopSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty title', () => {
      const data = {
        title: '',
        tenant_id: 1,
      };

      expect(() => CreateShopSchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters', () => {
      const data = {
        title: 'A'.repeat(256),
        tenant_id: 1,
      };

      expect(() => CreateShopSchema.parse(data)).toThrow();
    });

    it('should reject negative tenant_id', () => {
      const data = {
        title: 'Test Shop',
        tenant_id: -1,
      };

      expect(() => CreateShopSchema.parse(data)).toThrow();
    });

    it('should reject zero tenant_id', () => {
      const data = {
        title: 'Test Shop',
        tenant_id: 0,
      };

      expect(() => CreateShopSchema.parse(data)).toThrow();
    });

    it('should reject missing tenant_id', () => {
      const data = {
        title: 'Test Shop',
      };

      expect(() => CreateShopSchema.parse(data)).toThrow();
    });
  });

  describe('UpdateShopSchema', () => {
    it('should validate partial update with title', () => {
      const data = { title: 'New Title' };

      const result = UpdateShopSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty object', () => {
      const data = {};

      const result = UpdateShopSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty title on update', () => {
      const data = { title: '' };

      expect(() => UpdateShopSchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters on update', () => {
      const data = { title: 'A'.repeat(256) };

      expect(() => UpdateShopSchema.parse(data)).toThrow();
    });
  });
});
