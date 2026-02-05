import { describe, expect, it } from 'vitest';
import { CreateStatusSchema, ImportStatusItemSchema, UpdateStatusSchema } from './statuses.schema.js';

describe('Status Schemas', () => {
  describe('CreateStatusSchema', () => {
    it('should validate valid brand creation data', () => {
      const data = {
        code: 'mavyko',
        title: 'Мавико',
      };

      const result = CreateStatusSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty code', () => {
      const data = {
        code: '',
        title: 'Мавико',
      };

      expect(() => CreateStatusSchema.parse(data)).toThrow();
    });

    it('should reject code longer than 100 characters', () => {
      const data = {
        code: 'A'.repeat(101),
        title: 'Мавико',
      };

      expect(() => CreateStatusSchema.parse(data)).toThrow();
    });

    it('should reject empty title', () => {
      const data = {
        code: 'mavyko',
        title: '',
      };

      expect(() => CreateStatusSchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters', () => {
      const data = {
        code: 'mavyko',
        title: 'A'.repeat(256),
      };

      expect(() => CreateStatusSchema.parse(data)).toThrow();
    });

    it('should allow code with mixed case and special characters', () => {
      const data = {
        code: 'Test-Status_123',
        title: 'Test Status',
      };

      const result = CreateStatusSchema.parse(data);

      expect(result.code).toBe('Test-Status_123');
    });

    it('should handle Cyrillic characters in title', () => {
      const data = {
        code: 'marshall',
        title: 'MARSHALL',
      };

      const result = CreateStatusSchema.parse(data);

      expect(result).toEqual(data);
    });
  });

  describe('UpdateStatusSchema', () => {
    it('should allow updating only code', () => {
      const data = {
        code: 'new-code',
      };

      const result = UpdateStatusSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow updating only title', () => {
      const data = {
        title: 'New Title',
      };

      const result = UpdateStatusSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow updating both code and title', () => {
      const data = {
        code: 'new-code',
        title: 'New Title',
      };

      const result = UpdateStatusSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty object for partial update', () => {
      const data = {};

      const result = UpdateStatusSchema.parse(data);

      expect(result).toEqual({});
    });

    it('should reject empty code if provided', () => {
      const data = {
        code: '',
      };

      expect(() => UpdateStatusSchema.parse(data)).toThrow();
    });

    it('should reject empty title if provided', () => {
      const data = {
        title: '',
      };

      expect(() => UpdateStatusSchema.parse(data)).toThrow();
    });

    it('should reject code longer than 100 characters', () => {
      const data = {
        code: 'A'.repeat(101),
      };

      expect(() => UpdateStatusSchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters', () => {
      const data = {
        title: 'A'.repeat(256),
      };

      expect(() => UpdateStatusSchema.parse(data)).toThrow();
    });
  });

  describe('ImportStatusItemSchema', () => {
    it('should validate valid import item', () => {
      const data = {
        code: 'mavyko',
        title: 'Мавико',
      };

      const result = ImportStatusItemSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject item with missing code', () => {
      const data = {
        title: 'Мавико',
      };

      expect(() => ImportStatusItemSchema.parse(data)).toThrow();
    });

    it('should reject item with missing title', () => {
      const data = {
        code: 'mavyko',
      };

      expect(() => ImportStatusItemSchema.parse(data)).toThrow();
    });

    it('should reject item with empty code', () => {
      const data = {
        code: '',
        title: 'Мавико',
      };

      expect(() => ImportStatusItemSchema.parse(data)).toThrow();
    });

    it('should reject item with empty title', () => {
      const data = {
        code: 'mavyko',
        title: '',
      };

      expect(() => ImportStatusItemSchema.parse(data)).toThrow();
    });

    it('should handle multiple items with Cyrillic characters', () => {
      const items = [
        { code: 'mavyko', title: 'Мавико' },
        { code: 'marshall', title: 'MARSHALL' },
        { code: 'mazda', title: 'Mazda' },
      ];

      const results = items.map((item) => ImportStatusItemSchema.parse(item));

      expect(results).toEqual(items);
    });
  });
});
