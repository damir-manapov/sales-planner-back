import { describe, it, expect } from 'vitest';
import {
  PeriodQuerySchema,
  CreateSalesHistorySchema,
  UpdateSalesHistorySchema,
  ImportSalesHistoryItemSchema,
} from './sales-history.schema.js';

describe('Sales History Schemas', () => {
  describe('PeriodQuerySchema', () => {
    it('should validate valid period queries', () => {
      const data = {
        period_from: '2024-01',
        period_to: '2024-12',
      };

      const result = PeriodQuerySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow optional period_from', () => {
      const data = { period_to: '2024-12' };

      const result = PeriodQuerySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow optional period_to', () => {
      const data = { period_from: '2024-01' };

      const result = PeriodQuerySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow both periods to be omitted', () => {
      const data = {};

      const result = PeriodQuerySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject invalid period format - missing zero padding', () => {
      const data = { period_from: '2024-1' };

      expect(() => PeriodQuerySchema.parse(data)).toThrow();
    });

    it('should reject invalid period format - invalid month', () => {
      const data = { period_from: '2024-13' };

      expect(() => PeriodQuerySchema.parse(data)).toThrow();
    });

    it('should reject invalid period format - zero month', () => {
      const data = { period_from: '2024-00' };

      expect(() => PeriodQuerySchema.parse(data)).toThrow();
    });

    it('should reject invalid period format - wrong separator', () => {
      const data = { period_from: '2024/01' };

      expect(() => PeriodQuerySchema.parse(data)).toThrow();
    });
  });

  describe('CreateSalesHistorySchema', () => {
    it('should validate valid sales history data', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        sku_id: 100,
        period: '2024-01',
        quantity: 50,
      };

      const result = CreateSalesHistorySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should accept zero quantity', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        sku_id: 100,
        period: '2024-01',
        quantity: 0,
      };

      const result = CreateSalesHistorySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject negative quantity', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        sku_id: 100,
        period: '2024-01',
        quantity: -5,
      };

      expect(() => CreateSalesHistorySchema.parse(data)).toThrow();
    });

    it('should reject non-integer quantity', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        sku_id: 100,
        period: '2024-01',
        quantity: 5.5,
      };

      expect(() => CreateSalesHistorySchema.parse(data)).toThrow();
    });

    it('should reject invalid period format', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        sku_id: 100,
        period: '2024-1',
        quantity: 50,
      };

      expect(() => CreateSalesHistorySchema.parse(data)).toThrow();
    });

    it('should reject negative shop_id', () => {
      const data = {
        shop_id: -1,
        tenant_id: 1,
        sku_id: 100,
        period: '2024-01',
        quantity: 50,
      };

      expect(() => CreateSalesHistorySchema.parse(data)).toThrow();
    });

    it('should validate all valid months', () => {
      const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

      months.forEach((month) => {
        const data = {
          shop_id: 1,
          tenant_id: 1,
          sku_id: 100,
          period: `2024-${month}`,
          quantity: 50,
        };

        expect(() => CreateSalesHistorySchema.parse(data)).not.toThrow();
      });
    });
  });

  describe('UpdateSalesHistorySchema', () => {
    it('should validate valid update data', () => {
      const data = { quantity: 100 };

      const result = UpdateSalesHistorySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty update', () => {
      const data = {};

      const result = UpdateSalesHistorySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject negative quantity in update', () => {
      const data = { quantity: -10 };

      expect(() => UpdateSalesHistorySchema.parse(data)).toThrow();
    });

    it('should allow updating to zero', () => {
      const data = { quantity: 0 };

      const result = UpdateSalesHistorySchema.parse(data);

      expect(result).toEqual(data);
    });
  });

  describe('ImportSalesHistoryItemSchema', () => {
    it('should validate valid import item', () => {
      const data = {
        sku_code: 'SKU-001',
        period: '2024-01',
        quantity: 50,
      };

      const result = ImportSalesHistoryItemSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject missing sku_code', () => {
      const data = {
        period: '2024-01',
        quantity: 50,
      };

      expect(() => ImportSalesHistoryItemSchema.parse(data)).toThrow();
    });

    it('should reject empty sku_code', () => {
      const data = {
        sku_code: '',
        period: '2024-01',
        quantity: 50,
      };

      expect(() => ImportSalesHistoryItemSchema.parse(data)).toThrow();
    });

    it('should reject sku_code longer than 100 characters', () => {
      const data = {
        sku_code: 'A'.repeat(101),
        period: '2024-01',
        quantity: 50,
      };

      expect(() => ImportSalesHistoryItemSchema.parse(data)).toThrow();
    });

    it('should reject invalid period in import', () => {
      const data = {
        sku_code: 'SKU-001',
        period: 'invalid',
        quantity: 50,
      };

      expect(() => ImportSalesHistoryItemSchema.parse(data)).toThrow();
    });

    it('should validate array of import items', () => {
      const data = [
        { sku_code: 'SKU-001', period: '2024-01', quantity: 10 },
        { sku_code: 'SKU-002', period: '2024-02', quantity: 20 },
        { sku_code: 'SKU-003', period: '2024-03', quantity: 0 },
      ];

      const results = data.map((item) => ImportSalesHistoryItemSchema.parse(item));

      expect(results).toEqual(data);
    });
  });
});
