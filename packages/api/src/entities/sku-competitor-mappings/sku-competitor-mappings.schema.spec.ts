import { describe, expect, it } from 'vitest';
import {
  CreateSkuCompetitorMappingSchema,
  ImportSkuCompetitorMappingItemSchema,
  SkuCompetitorMappingQuerySchema,
  UpdateSkuCompetitorMappingSchema,
} from './sku-competitor-mappings.schema.js';

describe('SKU Competitor Mappings Schemas', () => {
  describe('SkuCompetitorMappingQuerySchema', () => {
    it('should validate valid pagination query', () => {
      const data = {
        limit: 10,
        offset: 0,
      };

      const result = SkuCompetitorMappingQuerySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty query', () => {
      const data = {};

      const result = SkuCompetitorMappingQuerySchema.parse(data);

      expect(result).toEqual(data);
    });
  });

  describe('CreateSkuCompetitorMappingSchema', () => {
    it('should validate valid mapping data', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        sku_id: 100,
        competitor_product_id: 50,
      };

      const result = CreateSkuCompetitorMappingSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject missing competitor_product_id', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        sku_id: 100,
      };

      expect(() => CreateSkuCompetitorMappingSchema.parse(data)).toThrow();
    });

    it('should reject negative competitor_product_id', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        sku_id: 100,
        competitor_product_id: -1,
      };

      expect(() => CreateSkuCompetitorMappingSchema.parse(data)).toThrow();
    });

    it('should require all mandatory fields', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        competitor_product_id: 50,
      };

      expect(() => CreateSkuCompetitorMappingSchema.parse(data)).toThrow();
    });
  });

  describe('UpdateSkuCompetitorMappingSchema', () => {
    it('should validate valid update data', () => {
      const data = { competitor_product_id: 100 };

      const result = UpdateSkuCompetitorMappingSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty update (all fields optional)', () => {
      const data = {};

      const result = UpdateSkuCompetitorMappingSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject negative competitor_product_id when provided', () => {
      const data = { competitor_product_id: -1 };

      expect(() => UpdateSkuCompetitorMappingSchema.parse(data)).toThrow();
    });
  });

  describe('ImportSkuCompetitorMappingItemSchema', () => {
    it('should validate valid import item', () => {
      const data = {
        sku: 'SKU001',
        marketplace: 'ozon',
        marketplaceProductId: '123456789012345',
      };

      const result = ImportSkuCompetitorMappingItemSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty sku code', () => {
      const data = {
        sku: '',
        marketplace: 'ozon',
        marketplaceProductId: '123456789012345',
      };

      expect(() => ImportSkuCompetitorMappingItemSchema.parse(data)).toThrow();
    });

    it('should reject empty marketplace code', () => {
      const data = {
        sku: 'SKU001',
        marketplace: '',
        marketplaceProductId: '123456789012345',
      };

      expect(() => ImportSkuCompetitorMappingItemSchema.parse(data)).toThrow();
    });

    it('should reject empty marketplaceProductId', () => {
      const data = {
        sku: 'SKU001',
        marketplace: 'ozon',
        marketplaceProductId: '',
      };

      expect(() => ImportSkuCompetitorMappingItemSchema.parse(data)).toThrow();
    });

    it('should accept numeric string marketplaceProductId', () => {
      const data = {
        sku: 'SKU001',
        marketplace: 'ozon',
        marketplaceProductId: '999999999999999',
      };

      const result = ImportSkuCompetitorMappingItemSchema.parse(data);

      expect(result.marketplaceProductId).toBe('999999999999999');
    });
  });
});
