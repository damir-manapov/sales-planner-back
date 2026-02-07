import { describe, expect, it } from 'vitest';
import {
  CreateSeasonalCoefficientSchema,
  ImportSeasonalCoefficientItemSchema,
  SeasonalCoefficientQuerySchema,
  UpdateSeasonalCoefficientSchema,
} from './seasonal-coefficients.schema.js';

describe('Seasonal Coefficients Schemas', () => {
  describe('SeasonalCoefficientQuerySchema', () => {
    it('should validate valid pagination query', () => {
      const data = {
        limit: 10,
        offset: 0,
      };

      const result = SeasonalCoefficientQuerySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty query', () => {
      const data = {};

      const result = SeasonalCoefficientQuerySchema.parse(data);

      expect(result).toEqual(data);
    });
  });

  describe('CreateSeasonalCoefficientSchema', () => {
    it('should validate valid seasonal coefficient data', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        group_id: 10,
        month: 6,
        coefficient: 1.25,
      };

      const result = CreateSeasonalCoefficientSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should accept month 1 (January)', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        group_id: 10,
        month: 1,
        coefficient: 1.0,
      };

      const result = CreateSeasonalCoefficientSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should accept month 12 (December)', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        group_id: 10,
        month: 12,
        coefficient: 1.5,
      };

      const result = CreateSeasonalCoefficientSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject month 0', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        group_id: 10,
        month: 0,
        coefficient: 1.0,
      };

      expect(() => CreateSeasonalCoefficientSchema.parse(data)).toThrow();
    });

    it('should reject month 13', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        group_id: 10,
        month: 13,
        coefficient: 1.0,
      };

      expect(() => CreateSeasonalCoefficientSchema.parse(data)).toThrow();
    });

    it('should reject zero coefficient', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        group_id: 10,
        month: 6,
        coefficient: 0,
      };

      expect(() => CreateSeasonalCoefficientSchema.parse(data)).toThrow();
    });

    it('should reject negative coefficient', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        group_id: 10,
        month: 6,
        coefficient: -0.5,
      };

      expect(() => CreateSeasonalCoefficientSchema.parse(data)).toThrow();
    });

    it('should require all mandatory fields', () => {
      const data = {
        shop_id: 1,
        tenant_id: 1,
        month: 6,
      };

      expect(() => CreateSeasonalCoefficientSchema.parse(data)).toThrow();
    });
  });

  describe('UpdateSeasonalCoefficientSchema', () => {
    it('should validate valid update data', () => {
      const data = { coefficient: 1.75 };

      const result = UpdateSeasonalCoefficientSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty update (all fields optional)', () => {
      const data = {};

      const result = UpdateSeasonalCoefficientSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject zero coefficient', () => {
      const data = { coefficient: 0 };

      expect(() => UpdateSeasonalCoefficientSchema.parse(data)).toThrow();
    });

    it('should reject negative coefficient', () => {
      const data = { coefficient: -1 };

      expect(() => UpdateSeasonalCoefficientSchema.parse(data)).toThrow();
    });
  });

  describe('ImportSeasonalCoefficientItemSchema', () => {
    it('should validate valid import item', () => {
      const data = {
        group: 'GROUP001',
        month: 6,
        coefficient: 1.25,
      };

      const result = ImportSeasonalCoefficientItemSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty group code', () => {
      const data = {
        group: '',
        month: 6,
        coefficient: 1.25,
      };

      expect(() => ImportSeasonalCoefficientItemSchema.parse(data)).toThrow();
    });

    it('should reject invalid month', () => {
      const data = {
        group: 'GROUP001',
        month: 15,
        coefficient: 1.25,
      };

      expect(() => ImportSeasonalCoefficientItemSchema.parse(data)).toThrow();
    });

    it('should reject non-positive coefficient', () => {
      const data = {
        group: 'GROUP001',
        month: 6,
        coefficient: 0,
      };

      expect(() => ImportSeasonalCoefficientItemSchema.parse(data)).toThrow();
    });
  });
});
