import { describe, expect, it } from 'vitest';
import {
  CreateWarehouseSchema,
  ImportWarehouseItemSchema,
  UpdateWarehouseSchema,
} from './warehouses.schema.js';

describe('Warehouse Schemas', () => {
  describe('CreateWarehouseSchema', () => {
    it('should validate valid warehouse creation data', () => {
      const data = {
        code: 'main',
        title: 'Main Warehouse',
      };

      const result = CreateWarehouseSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty code', () => {
      const data = {
        code: '',
        title: 'Main Warehouse',
      };

      expect(() => CreateWarehouseSchema.parse(data)).toThrow();
    });

    it('should reject code longer than 100 characters', () => {
      const data = {
        code: 'A'.repeat(101),
        title: 'Main Warehouse',
      };

      expect(() => CreateWarehouseSchema.parse(data)).toThrow();
    });

    it('should reject empty title', () => {
      const data = {
        code: 'main',
        title: '',
      };

      expect(() => CreateWarehouseSchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters', () => {
      const data = {
        code: 'main',
        title: 'A'.repeat(256),
      };

      expect(() => CreateWarehouseSchema.parse(data)).toThrow();
    });
  });

  describe('UpdateWarehouseSchema', () => {
    it('should allow updating only code', () => {
      const data = {
        code: 'new-code',
      };

      const result = UpdateWarehouseSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow updating only title', () => {
      const data = {
        title: 'New Title',
      };

      const result = UpdateWarehouseSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow updating both code and title', () => {
      const data = {
        code: 'new-code',
        title: 'New Title',
      };

      const result = UpdateWarehouseSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty object for partial update', () => {
      const data = {};

      const result = UpdateWarehouseSchema.parse(data);

      expect(result).toEqual({});
    });

    it('should reject empty code if provided', () => {
      const data = {
        code: '',
      };

      expect(() => UpdateWarehouseSchema.parse(data)).toThrow();
    });

    it('should reject empty title if provided', () => {
      const data = {
        title: '',
      };

      expect(() => UpdateWarehouseSchema.parse(data)).toThrow();
    });

    it('should reject code longer than 100 characters', () => {
      const data = {
        code: 'A'.repeat(101),
      };

      expect(() => UpdateWarehouseSchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters', () => {
      const data = {
        title: 'A'.repeat(256),
      };

      expect(() => UpdateWarehouseSchema.parse(data)).toThrow();
    });
  });

  describe('ImportWarehouseItemSchema', () => {
    it('should validate valid import item', () => {
      const data = {
        code: 'main',
        title: 'Main Warehouse',
      };

      const result = ImportWarehouseItemSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject item with missing code', () => {
      const data = {
        title: 'Main Warehouse',
      };

      expect(() => ImportWarehouseItemSchema.parse(data)).toThrow();
    });

    it('should reject item with missing title', () => {
      const data = {
        code: 'main',
      };

      expect(() => ImportWarehouseItemSchema.parse(data)).toThrow();
    });

    it('should reject item with empty code', () => {
      const data = {
        code: '',
        title: 'Main Warehouse',
      };

      expect(() => ImportWarehouseItemSchema.parse(data)).toThrow();
    });

    it('should reject item with empty title', () => {
      const data = {
        code: 'main',
        title: '',
      };

      expect(() => ImportWarehouseItemSchema.parse(data)).toThrow();
    });
  });
});
