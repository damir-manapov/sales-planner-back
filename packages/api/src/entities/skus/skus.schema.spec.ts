import { describe, expect, it } from 'vitest';
import { CreateSkuSchema, ImportSkuItemSchema, UpdateSkuSchema } from './skus.schema.js';

describe('SKU Schemas', () => {
  describe('CreateSkuSchema', () => {
    it('should validate valid SKU creation data', () => {
      const data = {
        code: 'SKU-001',
        title: 'Test Product',
      };

      const result = CreateSkuSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty code', () => {
      const data = {
        code: '',
        title: 'Test Product',
      };

      expect(() => CreateSkuSchema.parse(data)).toThrow();
    });

    it('should reject code longer than 100 characters', () => {
      const data = {
        code: 'A'.repeat(101),
        title: 'Test Product',
      };

      expect(() => CreateSkuSchema.parse(data)).toThrow();
    });

    it('should reject empty title', () => {
      const data = {
        code: 'SKU-001',
        title: '',
      };

      expect(() => CreateSkuSchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters', () => {
      const data = {
        code: 'SKU-001',
        title: 'A'.repeat(256),
      };

      expect(() => CreateSkuSchema.parse(data)).toThrow();
    });
  });

  describe('UpdateSkuSchema', () => {
    it('should validate valid update data', () => {
      const data = {
        code: 'SKU-002',
        title: 'Updated Product',
      };

      const result = UpdateSkuSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow partial updates - code only', () => {
      const data = { code: 'SKU-002' };

      const result = UpdateSkuSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow partial updates - title only', () => {
      const data = { title: 'Updated Title' };

      const result = UpdateSkuSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty object for no updates', () => {
      const data = {};

      const result = UpdateSkuSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject invalid code in update', () => {
      const data = { code: '' };

      expect(() => UpdateSkuSchema.parse(data)).toThrow();
    });

    it('should reject invalid title in update', () => {
      const data = { title: '' };

      expect(() => UpdateSkuSchema.parse(data)).toThrow();
    });
  });

  describe('ImportSkuItemSchema', () => {
    it('should validate valid import item', () => {
      const data = {
        code: 'SKU-001',
        title: 'Import Product',
      };

      const result = ImportSkuItemSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject import item without code', () => {
      const data = { title: 'Import Product' };

      expect(() => ImportSkuItemSchema.parse(data)).toThrow();
    });

    it('should reject import item without title', () => {
      const data = { code: 'SKU-001' };

      expect(() => ImportSkuItemSchema.parse(data)).toThrow();
    });

    it('should validate array of import items', () => {
      const data = [
        { code: 'SKU-001', title: 'Product 1' },
        { code: 'SKU-002', title: 'Product 2' },
      ];

      const results = data.map((item) => ImportSkuItemSchema.parse(item));

      expect(results).toEqual(data);
    });

    it('should accept maximum length values', () => {
      const data = {
        code: 'A'.repeat(100),
        title: 'B'.repeat(255),
      };

      const result = ImportSkuItemSchema.parse(data);

      expect(result).toEqual(data);
    });
  });
});
