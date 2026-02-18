import { describe, expect, it } from 'vitest';
import {
  CreateCompetitorProductSchema,
  ImportCompetitorProductItemSchema,
  UpdateCompetitorProductSchema,
} from './competitor-products.schema.js';

describe('Competitor Products Schemas', () => {
  describe('CreateCompetitorProductSchema', () => {
    it('should validate valid competitor product data', () => {
      const data = {
        shopId: 1,
        tenantId: 1,
        marketplaceId: 10,
        marketplaceProductId: '123456789012345',
        title: 'Competitor Product',
        brand: 'CompetitorBrand',
      };

      const result = CreateCompetitorProductSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow optional title and brand', () => {
      const data = {
        shopId: 1,
        tenantId: 1,
        marketplaceId: 10,
        marketplaceProductId: '123456789012345',
      };

      const result = CreateCompetitorProductSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty string for title and brand', () => {
      const data = {
        shopId: 1,
        tenantId: 1,
        marketplaceId: 10,
        marketplaceProductId: '123456789012345',
        title: '',
        brand: '',
      };

      const result = CreateCompetitorProductSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject missing shopId', () => {
      const data = {
        tenantId: 1,
        marketplaceId: 10,
        marketplaceProductId: '123456789012345',
      };

      expect(() => CreateCompetitorProductSchema.parse(data)).toThrow();
    });

    it('should reject missing marketplaceId', () => {
      const data = {
        shopId: 1,
        tenantId: 1,
        marketplaceProductId: '123456789012345',
      };

      expect(() => CreateCompetitorProductSchema.parse(data)).toThrow();
    });

    it('should reject missing marketplaceProductId', () => {
      const data = {
        shopId: 1,
        tenantId: 1,
        marketplaceId: 10,
      };

      expect(() => CreateCompetitorProductSchema.parse(data)).toThrow();
    });

    it('should reject negative shopId', () => {
      const data = {
        shopId: -1,
        tenantId: 1,
        marketplaceId: 10,
        marketplaceProductId: '123456789012345',
      };

      expect(() => CreateCompetitorProductSchema.parse(data)).toThrow();
    });
  });

  describe('UpdateCompetitorProductSchema', () => {
    it('should validate valid update data with title', () => {
      const data = { title: 'Updated Title' };

      const result = UpdateCompetitorProductSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate valid update data with brand', () => {
      const data = { brand: 'Updated Brand' };

      const result = UpdateCompetitorProductSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate valid update data with both fields', () => {
      const data = { title: 'Updated Title', brand: 'Updated Brand' };

      const result = UpdateCompetitorProductSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty update (all fields optional)', () => {
      const data = {};

      const result = UpdateCompetitorProductSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty string for title', () => {
      const data = { title: '' };

      const result = UpdateCompetitorProductSchema.parse(data);

      expect(result).toEqual(data);
    });
  });

  describe('ImportCompetitorProductItemSchema', () => {
    it('should validate valid import item with all fields', () => {
      const data = {
        marketplace: 'ozon',
        marketplaceProductId: '123456789012345',
        title: 'Product Title',
        brand: 'Product Brand',
      };

      const result = ImportCompetitorProductItemSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow optional title and brand', () => {
      const data = {
        marketplace: 'ozon',
        marketplaceProductId: '123456789012345',
      };

      const result = ImportCompetitorProductItemSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty marketplace code', () => {
      const data = {
        marketplace: '',
        marketplaceProductId: '123456789012345',
      };

      expect(() => ImportCompetitorProductItemSchema.parse(data)).toThrow();
    });

    it('should reject empty marketplaceProductId', () => {
      const data = {
        marketplace: 'ozon',
        marketplaceProductId: '',
      };

      expect(() => ImportCompetitorProductItemSchema.parse(data)).toThrow();
    });

    it('should accept numeric string marketplaceProductId', () => {
      const data = {
        marketplace: 'ozon',
        marketplaceProductId: '999999999999999',
      };

      const result = ImportCompetitorProductItemSchema.parse(data);

      expect(result.marketplaceProductId).toBe('999999999999999');
    });
  });
});
