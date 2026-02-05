import { describe, expect, it } from 'vitest';
import { CreateBrandSchema, ImportBrandItemSchema, UpdateBrandSchema } from './brands.schema.js';

describe('Brand Schemas', () => {
  describe('CreateBrandSchema', () => {
    it('should validate valid brand creation data', () => {
      const data = {
        code: 'mavyko',
        title: 'Мавико',
      };

      const result = CreateBrandSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty code', () => {
      const data = {
        code: '',
        title: 'Мавико',
      };

      expect(() => CreateBrandSchema.parse(data)).toThrow();
    });

    it('should reject code longer than 100 characters', () => {
      const data = {
        code: 'A'.repeat(101),
        title: 'Мавико',
      };

      expect(() => CreateBrandSchema.parse(data)).toThrow();
    });

    it('should reject empty title', () => {
      const data = {
        code: 'mavyko',
        title: '',
      };

      expect(() => CreateBrandSchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters', () => {
      const data = {
        code: 'mavyko',
        title: 'A'.repeat(256),
      };

      expect(() => CreateBrandSchema.parse(data)).toThrow();
    });
  });

  describe('UpdateBrandSchema', () => {
    it('should allow updating only code', () => {
      const data = {
        code: 'new-code',
      };

      const result = UpdateBrandSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow updating only title', () => {
      const data = {
        title: 'New Title',
      };

      const result = UpdateBrandSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow updating both code and title', () => {
      const data = {
        code: 'new-code',
        title: 'New Title',
      };

      const result = UpdateBrandSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty object for partial update', () => {
      const data = {};

      const result = UpdateBrandSchema.parse(data);

      expect(result).toEqual({});
    });

    it('should reject empty code if provided', () => {
      const data = {
        code: '',
      };

      expect(() => UpdateBrandSchema.parse(data)).toThrow();
    });

    it('should reject empty title if provided', () => {
      const data = {
        title: '',
      };

      expect(() => UpdateBrandSchema.parse(data)).toThrow();
    });

    it('should reject code longer than 100 characters', () => {
      const data = {
        code: 'A'.repeat(101),
      };

      expect(() => UpdateBrandSchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters', () => {
      const data = {
        title: 'A'.repeat(256),
      };

      expect(() => UpdateBrandSchema.parse(data)).toThrow();
    });
  });

  describe('ImportBrandItemSchema', () => {
    it('should validate valid import item', () => {
      const data = {
        code: 'mavyko',
        title: 'Мавико',
      };

      const result = ImportBrandItemSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject item with missing code', () => {
      const data = {
        title: 'Мавико',
      };

      expect(() => ImportBrandItemSchema.parse(data)).toThrow();
    });

    it('should reject item with missing title', () => {
      const data = {
        code: 'mavyko',
      };

      expect(() => ImportBrandItemSchema.parse(data)).toThrow();
    });

    it('should reject item with empty code', () => {
      const data = {
        code: '',
        title: 'Мавико',
      };

      expect(() => ImportBrandItemSchema.parse(data)).toThrow();
    });

    it('should reject item with empty title', () => {
      const data = {
        code: 'mavyko',
        title: '',
      };

      expect(() => ImportBrandItemSchema.parse(data)).toThrow();
    });
  });
});
