import { describe, expect, it } from 'vitest';
import {
  CreateLeftoverSchema,
  ImportLeftoverItemSchema,
  LeftoverQuerySchema,
  UpdateLeftoverSchema,
} from './leftovers.schema.js';

describe('Leftovers Schemas', () => {
  describe('LeftoverQuerySchema', () => {
    it('should validate valid period queries', () => {
      const data = {
        period_from: '2024-01',
        period_to: '2024-12',
      };

      const result = LeftoverQuerySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow optional period_from', () => {
      const data = { period_to: '2024-12' };

      const result = LeftoverQuerySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow optional period_to', () => {
      const data = { period_from: '2024-01' };

      const result = LeftoverQuerySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow both periods to be omitted', () => {
      const data = {};

      const result = LeftoverQuerySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject invalid period format - missing zero padding', () => {
      const data = { period_from: '2024-1' };

      expect(() => LeftoverQuerySchema.parse(data)).toThrow();
    });

    it('should reject invalid period format - invalid month', () => {
      const data = { period_from: '2024-13' };

      expect(() => LeftoverQuerySchema.parse(data)).toThrow();
    });

    it('should reject invalid period format - zero month', () => {
      const data = { period_from: '2024-00' };

      expect(() => LeftoverQuerySchema.parse(data)).toThrow();
    });
  });

  describe('CreateLeftoverSchema', () => {
    it('should validate valid leftover data', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        warehouse_id: 10,
        sku_id: 100,
        period: '2024-01',
        quantity: 50,
      };

      const result = CreateLeftoverSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should accept zero quantity', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        warehouse_id: 10,
        sku_id: 100,
        period: '2024-01',
        quantity: 0,
      };

      const result = CreateLeftoverSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject negative quantity', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        warehouse_id: 10,
        sku_id: 100,
        period: '2024-01',
        quantity: -1,
      };

      expect(() => CreateLeftoverSchema.parse(data)).toThrow();
    });

    it('should reject invalid period format', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        warehouse_id: 10,
        sku_id: 100,
        period: '2024/01',
        quantity: 50,
      };

      expect(() => CreateLeftoverSchema.parse(data)).toThrow();
    });

    it('should require all mandatory fields', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        sku_id: 100,
        period: '2024-01',
      };

      expect(() => CreateLeftoverSchema.parse(data)).toThrow();
    });
  });

  describe('UpdateLeftoverSchema', () => {
    it('should validate valid update data', () => {
      const data = { quantity: 100 };

      const result = UpdateLeftoverSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty update (all fields optional)', () => {
      const data = {};

      const result = UpdateLeftoverSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject negative quantity', () => {
      const data = { quantity: -10 };

      expect(() => UpdateLeftoverSchema.parse(data)).toThrow();
    });
  });

  describe('ImportLeftoverItemSchema', () => {
    it('should validate valid import item', () => {
      const data = {
        warehouse: 'WH001',
        sku: 'SKU001',
        period: '2024-01',
        quantity: 100,
      };

      const result = ImportLeftoverItemSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty warehouse code', () => {
      const data = {
        warehouse: '',
        sku: 'SKU001',
        period: '2024-01',
        quantity: 100,
      };

      expect(() => ImportLeftoverItemSchema.parse(data)).toThrow();
    });

    it('should reject invalid period format', () => {
      const data = {
        warehouse: 'WH001',
        sku: 'SKU001',
        period: '01-2024',
        quantity: 100,
      };

      expect(() => ImportLeftoverItemSchema.parse(data)).toThrow();
    });

    it('should reject negative quantity', () => {
      const data = {
        warehouse: 'WH001',
        sku: 'SKU001',
        period: '2024-01',
        quantity: -100,
      };

      expect(() => ImportLeftoverItemSchema.parse(data)).toThrow();
    });
  });
});
