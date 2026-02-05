import { describe, expect, it } from 'vitest';
import { CreateCategorySchema, ImportCategoryItemSchema, UpdateCategorySchema } from './categories.schema.js';

describe('Category Schemas', () => {
  describe('CreateCategorySchema', () => {
    it('should validate valid brand creation data', () => {
      const data = {
        code: 'mavyko',
        title: 'Мавико',
      };

      const result = CreateCategorySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty code', () => {
      const data = {
        code: '',
        title: 'Мавико',
      };

      expect(() => CreateCategorySchema.parse(data)).toThrow();
    });

    it('should reject code longer than 100 characters', () => {
      const data = {
        code: 'A'.repeat(101),
        title: 'Мавико',
      };

      expect(() => CreateCategorySchema.parse(data)).toThrow();
    });

    it('should reject empty title', () => {
      const data = {
        code: 'mavyko',
        title: '',
      };

      expect(() => CreateCategorySchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters', () => {
      const data = {
        code: 'mavyko',
        title: 'A'.repeat(256),
      };

      expect(() => CreateCategorySchema.parse(data)).toThrow();
    });

    it('should allow code with mixed case and special characters', () => {
      const data = {
        code: 'Test-Category_123',
        title: 'Test Category',
      };

      const result = CreateCategorySchema.parse(data);

      expect(result.code).toBe('Test-Category_123');
    });

    it('should handle Cyrillic characters in title', () => {
      const data = {
        code: 'marshall',
        title: 'MARSHALL',
      };

      const result = CreateCategorySchema.parse(data);

      expect(result).toEqual(data);
    });
  });

  describe('UpdateCategorySchema', () => {
    it('should allow updating only code', () => {
      const data = {
        code: 'new-code',
      };

      const result = UpdateCategorySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow updating only title', () => {
      const data = {
        title: 'New Title',
      };

      const result = UpdateCategorySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow updating both code and title', () => {
      const data = {
        code: 'new-code',
        title: 'New Title',
      };

      const result = UpdateCategorySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty object for partial update', () => {
      const data = {};

      const result = UpdateCategorySchema.parse(data);

      expect(result).toEqual({});
    });

    it('should reject empty code if provided', () => {
      const data = {
        code: '',
      };

      expect(() => UpdateCategorySchema.parse(data)).toThrow();
    });

    it('should reject empty title if provided', () => {
      const data = {
        title: '',
      };

      expect(() => UpdateCategorySchema.parse(data)).toThrow();
    });

    it('should reject code longer than 100 characters', () => {
      const data = {
        code: 'A'.repeat(101),
      };

      expect(() => UpdateCategorySchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters', () => {
      const data = {
        title: 'A'.repeat(256),
      };

      expect(() => UpdateCategorySchema.parse(data)).toThrow();
    });
  });

  describe('ImportCategoryItemSchema', () => {
    it('should validate valid import item', () => {
      const data = {
        code: 'mavyko',
        title: 'Мавико',
      };

      const result = ImportCategoryItemSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject item with missing code', () => {
      const data = {
        title: 'Мавико',
      };

      expect(() => ImportCategoryItemSchema.parse(data)).toThrow();
    });

    it('should reject item with missing title', () => {
      const data = {
        code: 'mavyko',
      };

      expect(() => ImportCategoryItemSchema.parse(data)).toThrow();
    });

    it('should reject item with empty code', () => {
      const data = {
        code: '',
        title: 'Мавико',
      };

      expect(() => ImportCategoryItemSchema.parse(data)).toThrow();
    });

    it('should reject item with empty title', () => {
      const data = {
        code: 'mavyko',
        title: '',
      };

      expect(() => ImportCategoryItemSchema.parse(data)).toThrow();
    });

    it('should handle multiple items with Cyrillic characters', () => {
      const items = [
        { code: 'mavyko', title: 'Мавико' },
        { code: 'marshall', title: 'MARSHALL' },
        { code: 'mazda', title: 'Mazda' },
      ];

      const results = items.map((item) => ImportCategoryItemSchema.parse(item));

      expect(results).toEqual(items);
    });
  });
});
