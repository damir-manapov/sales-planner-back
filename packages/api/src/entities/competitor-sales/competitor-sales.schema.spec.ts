import { describe, expect, it } from 'vitest';
import {
  CompetitorSaleQuerySchema,
  CreateCompetitorSaleSchema,
  ImportCompetitorSaleItemSchema,
  UpdateCompetitorSaleSchema,
} from './competitor-sales.schema.js';

describe('Competitor Sales Schemas', () => {
  describe('CompetitorSaleQuerySchema', () => {
    it('should validate valid period queries', () => {
      const data = {
        periodFrom: '2024-01',
        periodTo: '2024-12',
      };

      const result = CompetitorSaleQuerySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow optional periodFrom', () => {
      const data = { periodTo: '2024-12' };

      const result = CompetitorSaleQuerySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow optional periodTo', () => {
      const data = { periodFrom: '2024-01' };

      const result = CompetitorSaleQuerySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow both periods to be omitted', () => {
      const data = {};

      const result = CompetitorSaleQuerySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject invalid period format - missing zero padding', () => {
      const data = { periodFrom: '2024-1' };

      expect(() => CompetitorSaleQuerySchema.parse(data)).toThrow();
    });

    it('should reject invalid period format - invalid month', () => {
      const data = { periodFrom: '2024-13' };

      expect(() => CompetitorSaleQuerySchema.parse(data)).toThrow();
    });

    it('should reject invalid period format - zero month', () => {
      const data = { periodFrom: '2024-00' };

      expect(() => CompetitorSaleQuerySchema.parse(data)).toThrow();
    });
  });

  describe('CreateCompetitorSaleSchema', () => {
    it('should validate valid competitor sale data', () => {
      const data = {
        shopId: 1,
        tenantId: 1,
        competitorProductId: 50,
        period: '2024-01',
        quantity: 100,
      };

      const result = CreateCompetitorSaleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should accept zero quantity', () => {
      const data = {
        shopId: 1,
        tenantId: 1,
        competitorProductId: 50,
        period: '2024-01',
        quantity: 0,
      };

      const result = CreateCompetitorSaleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject negative quantity', () => {
      const data = {
        shopId: 1,
        tenantId: 1,
        competitorProductId: 50,
        period: '2024-01',
        quantity: -1,
      };

      expect(() => CreateCompetitorSaleSchema.parse(data)).toThrow();
    });

    it('should reject missing competitorProductId', () => {
      const data = {
        shopId: 1,
        tenantId: 1,
        period: '2024-01',
        quantity: 100,
      };

      expect(() => CreateCompetitorSaleSchema.parse(data)).toThrow();
    });

    it('should reject invalid period format', () => {
      const data = {
        shopId: 1,
        tenantId: 1,
        competitorProductId: 50,
        period: '2024/01',
        quantity: 50,
      };

      expect(() => CreateCompetitorSaleSchema.parse(data)).toThrow();
    });

    it('should require all mandatory fields', () => {
      const data = {
        shopId: 1,
        tenantId: 1,
        period: '2024-01',
      };

      expect(() => CreateCompetitorSaleSchema.parse(data)).toThrow();
    });
  });

  describe('UpdateCompetitorSaleSchema', () => {
    it('should validate valid update data', () => {
      const data = { quantity: 200 };

      const result = UpdateCompetitorSaleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty update (all fields optional)', () => {
      const data = {};

      const result = UpdateCompetitorSaleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject negative quantity', () => {
      const data = { quantity: -10 };

      expect(() => UpdateCompetitorSaleSchema.parse(data)).toThrow();
    });
  });

  describe('ImportCompetitorSaleItemSchema', () => {
    it('should validate valid import item', () => {
      const data = {
        marketplace: 'ozon',
        marketplaceProductId: '123456789012345',
        period: '2024-01',
        quantity: 100,
      };

      const result = ImportCompetitorSaleItemSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty marketplace code', () => {
      const data = {
        marketplace: '',
        marketplaceProductId: '123456789012345',
        period: '2024-01',
        quantity: 100,
      };

      expect(() => ImportCompetitorSaleItemSchema.parse(data)).toThrow();
    });

    it('should reject empty marketplaceProductId', () => {
      const data = {
        marketplace: 'ozon',
        marketplaceProductId: '',
        period: '2024-01',
        quantity: 100,
      };

      expect(() => ImportCompetitorSaleItemSchema.parse(data)).toThrow();
    });

    it('should reject invalid period format', () => {
      const data = {
        marketplace: 'ozon',
        marketplaceProductId: '123456789012345',
        period: '01-2024',
        quantity: 100,
      };

      expect(() => ImportCompetitorSaleItemSchema.parse(data)).toThrow();
    });

    it('should reject negative quantity', () => {
      const data = {
        marketplace: 'ozon',
        marketplaceProductId: '123456789012345',
        period: '2024-01',
        quantity: -100,
      };

      expect(() => ImportCompetitorSaleItemSchema.parse(data)).toThrow();
    });

    it('should accept numeric string marketplaceProductId', () => {
      const data = {
        marketplace: 'ozon',
        marketplaceProductId: '999999999999999',
        period: '2024-01',
        quantity: 100,
      };

      const result = ImportCompetitorSaleItemSchema.parse(data);

      expect(result.marketplaceProductId).toBe('999999999999999');
    });
  });
});
