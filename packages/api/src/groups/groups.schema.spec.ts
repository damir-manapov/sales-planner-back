import { describe, expect, it } from 'vitest';
import { CreateGroupSchema, ImportGroupItemSchema, UpdateGroupSchema } from './groups.schema.js';

describe('Group Schemas', () => {
  describe('CreateGroupSchema', () => {
    it('should validate valid brand creation data', () => {
      const data = {
        code: 'mavyko',
        title: 'Мавико',
      };

      const result = CreateGroupSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty code', () => {
      const data = {
        code: '',
        title: 'Мавико',
      };

      expect(() => CreateGroupSchema.parse(data)).toThrow();
    });

    it('should reject code longer than 100 characters', () => {
      const data = {
        code: 'A'.repeat(101),
        title: 'Мавико',
      };

      expect(() => CreateGroupSchema.parse(data)).toThrow();
    });

    it('should reject empty title', () => {
      const data = {
        code: 'mavyko',
        title: '',
      };

      expect(() => CreateGroupSchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters', () => {
      const data = {
        code: 'mavyko',
        title: 'A'.repeat(256),
      };

      expect(() => CreateGroupSchema.parse(data)).toThrow();
    });

    it('should allow code with mixed case and special characters', () => {
      const data = {
        code: 'Test-Group_123',
        title: 'Test Group',
      };

      const result = CreateGroupSchema.parse(data);

      expect(result.code).toBe('Test-Group_123');
    });

    it('should handle Cyrillic characters in title', () => {
      const data = {
        code: 'marshall',
        title: 'MARSHALL',
      };

      const result = CreateGroupSchema.parse(data);

      expect(result).toEqual(data);
    });
  });

  describe('UpdateGroupSchema', () => {
    it('should allow updating only code', () => {
      const data = {
        code: 'new-code',
      };

      const result = UpdateGroupSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow updating only title', () => {
      const data = {
        title: 'New Title',
      };

      const result = UpdateGroupSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow updating both code and title', () => {
      const data = {
        code: 'new-code',
        title: 'New Title',
      };

      const result = UpdateGroupSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty object for partial update', () => {
      const data = {};

      const result = UpdateGroupSchema.parse(data);

      expect(result).toEqual({});
    });

    it('should reject empty code if provided', () => {
      const data = {
        code: '',
      };

      expect(() => UpdateGroupSchema.parse(data)).toThrow();
    });

    it('should reject empty title if provided', () => {
      const data = {
        title: '',
      };

      expect(() => UpdateGroupSchema.parse(data)).toThrow();
    });

    it('should reject code longer than 100 characters', () => {
      const data = {
        code: 'A'.repeat(101),
      };

      expect(() => UpdateGroupSchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters', () => {
      const data = {
        title: 'A'.repeat(256),
      };

      expect(() => UpdateGroupSchema.parse(data)).toThrow();
    });
  });

  describe('ImportGroupItemSchema', () => {
    it('should validate valid import item', () => {
      const data = {
        code: 'mavyko',
        title: 'Мавико',
      };

      const result = ImportGroupItemSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject item with missing code', () => {
      const data = {
        title: 'Мавико',
      };

      expect(() => ImportGroupItemSchema.parse(data)).toThrow();
    });

    it('should reject item with missing title', () => {
      const data = {
        code: 'mavyko',
      };

      expect(() => ImportGroupItemSchema.parse(data)).toThrow();
    });

    it('should reject item with empty code', () => {
      const data = {
        code: '',
        title: 'Мавико',
      };

      expect(() => ImportGroupItemSchema.parse(data)).toThrow();
    });

    it('should reject item with empty title', () => {
      const data = {
        code: 'mavyko',
        title: '',
      };

      expect(() => ImportGroupItemSchema.parse(data)).toThrow();
    });

    it('should handle multiple items with Cyrillic characters', () => {
      const items = [
        { code: 'mavyko', title: 'Мавико' },
        { code: 'marshall', title: 'MARSHALL' },
        { code: 'mazda', title: 'Mazda' },
      ];

      const results = items.map((item) => ImportGroupItemSchema.parse(item));

      expect(results).toEqual(items);
    });
  });
});
