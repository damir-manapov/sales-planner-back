import { describe, expect, it } from 'vitest';
import { CreateSupplierSchema, ImportSupplierItemSchema, UpdateSupplierSchema } from './suppliers.schema.js';

describe('Supplier Schemas', () => {
  describe('CreateSupplierSchema', () => {
    it('should validate valid supplier creation data', () => {
      const data = {
        code: 'supplier1',
        title: 'Example Supplier',
      };

      const result = CreateSupplierSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty code', () => {
      const data = {
        code: '',
        title: 'Example Supplier',
      };

      expect(() => CreateSupplierSchema.parse(data)).toThrow();
    });

    it('should reject code longer than 100 characters', () => {
      const data = {
        code: 'A'.repeat(101),
        title: 'Example Supplier',
      };

      expect(() => CreateSupplierSchema.parse(data)).toThrow();
    });

    it('should reject empty title', () => {
      const data = {
        code: 'supplier1',
        title: '',
      };

      expect(() => CreateSupplierSchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters', () => {
      const data = {
        code: 'supplier1',
        title: 'A'.repeat(256),
      };

      expect(() => CreateSupplierSchema.parse(data)).toThrow();
    });
  });

  describe('UpdateSupplierSchema', () => {
    it('should validate valid supplier update data', () => {
      const data = {
        code: 'supplier1',
        title: 'Updated Supplier',
      };

      const result = UpdateSupplierSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty update (all fields optional)', () => {
      const data = {};

      const result = UpdateSupplierSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow updating only code', () => {
      const data = {
        code: 'supplier2',
      };

      const result = UpdateSupplierSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow updating only title', () => {
      const data = {
        title: 'New Title',
      };

      const result = UpdateSupplierSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject invalid code', () => {
      const data = {
        code: 'A'.repeat(101),
      };

      expect(() => UpdateSupplierSchema.parse(data)).toThrow();
    });

    it('should reject invalid title', () => {
      const data = {
        title: 'A'.repeat(256),
      };

      expect(() => UpdateSupplierSchema.parse(data)).toThrow();
    });
  });

  describe('ImportSupplierItemSchema', () => {
    it('should validate valid import data', () => {
      const data = {
        code: 'supplier1',
        title: 'Example Supplier',
      };

      const result = ImportSupplierItemSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject missing code', () => {
      const data = {
        title: 'Example Supplier',
      };

      expect(() => ImportSupplierItemSchema.parse(data)).toThrow();
    });

    it('should reject missing title', () => {
      const data = {
        code: 'supplier1',
      };

      expect(() => ImportSupplierItemSchema.parse(data)).toThrow();
    });

    it('should reject empty code', () => {
      const data = {
        code: '',
        title: 'Example Supplier',
      };

      expect(() => ImportSupplierItemSchema.parse(data)).toThrow();
    });

    it('should reject empty title', () => {
      const data = {
        code: 'supplier1',
        title: '',
      };

      expect(() => ImportSupplierItemSchema.parse(data)).toThrow();
    });

    it('should reject invalid code', () => {
      const data = {
        code: 'A'.repeat(101),
        title: 'Example Supplier',
      };

      expect(() => ImportSupplierItemSchema.parse(data)).toThrow();
    });

    it('should reject invalid title', () => {
      const data = {
        code: 'supplier1',
        title: 'A'.repeat(256),
      };

      expect(() => ImportSupplierItemSchema.parse(data)).toThrow();
    });
  });
});
