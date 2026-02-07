import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { checkForDuplicates } from './export-import.helpers.js';
import { parseAndValidateImport, parseImportData, validateArray } from './import.helpers.js';

describe('import.helpers', () => {
  const TestSchema = z.object({
    code: z.string().min(1),
    value: z.number(),
  });

  describe('parseImportData', () => {
    it('should parse data from file upload', () => {
      const file = {
        buffer: Buffer.from(JSON.stringify([{ code: 'A', value: 1 }])),
      } as Express.Multer.File;

      const result = parseImportData(file, undefined);

      expect(result).toEqual([{ code: 'A', value: 1 }]);
    });

    it('should use body items when file is not provided', () => {
      const items = [{ code: 'B', value: 2 }];

      const result = parseImportData(undefined, items);

      expect(result).toEqual(items);
    });

    it('should throw when neither file nor items provided', () => {
      expect(() => parseImportData(undefined, undefined)).toThrow(BadRequestException);
      expect(() => parseImportData(undefined, undefined)).toThrow(
        'Either file or JSON body is required',
      );
    });

    it('should throw when parsed data is not an array', () => {
      const file = {
        buffer: Buffer.from(JSON.stringify({ code: 'A', value: 1 })),
      } as Express.Multer.File;

      expect(() => parseImportData(file, undefined)).toThrow(BadRequestException);
      expect(() => parseImportData(file, undefined)).toThrow('Data must be an array');
    });

    it('should handle UTF-8 encoded file content', () => {
      const data = [{ code: 'тест', value: 3 }];
      const file = {
        buffer: Buffer.from(JSON.stringify(data), 'utf-8'),
      } as Express.Multer.File;

      const result = parseImportData(file, undefined);

      expect(result).toEqual(data);
    });
  });

  describe('validateArray', () => {
    it('should validate valid items', () => {
      const items = [
        { code: 'A', value: 1 },
        { code: 'B', value: 2 },
      ];

      const result = validateArray(items, TestSchema);

      expect(result).toEqual(items);
    });

    it('should throw on invalid item with index', () => {
      const items = [
        { code: 'A', value: 1 },
        { code: '', value: 2 },
      ];

      expect(() => validateArray(items, TestSchema)).toThrow(BadRequestException);
      expect(() => validateArray(items, TestSchema)).toThrow('Invalid item at index 1');
    });

    it('should throw on type mismatch', () => {
      const items = [{ code: 'A', value: 'not-a-number' }];

      expect(() => validateArray(items, TestSchema)).toThrow(BadRequestException);
      expect(() => validateArray(items, TestSchema)).toThrow('Invalid item at index 0');
    });

    it('should validate empty array', () => {
      const result = validateArray([], TestSchema);

      expect(result).toEqual([]);
    });

    it('should throw on missing required field', () => {
      const items = [{ code: 'A' }];

      expect(() => validateArray(items, TestSchema)).toThrow(BadRequestException);
      expect(() => validateArray(items, TestSchema)).toThrow('Invalid item at index 0');
    });
  });

  describe('parseAndValidateImport', () => {
    it('should parse and validate from file', () => {
      const data = [{ code: 'A', value: 1 }];
      const file = {
        buffer: Buffer.from(JSON.stringify(data)),
      } as Express.Multer.File;

      const result = parseAndValidateImport(file, undefined, TestSchema);

      expect(result).toEqual(data);
    });

    it('should parse and validate from body', () => {
      const items = [{ code: 'B', value: 2 }];

      const result = parseAndValidateImport(undefined, items, TestSchema);

      expect(result).toEqual(items);
    });

    it('should throw when data is invalid', () => {
      const items = [{ code: '', value: 2 }];

      expect(() => parseAndValidateImport(undefined, items, TestSchema)).toThrow(
        BadRequestException,
      );
    });

    it('should handle complex validation schema', () => {
      const ComplexSchema = z.object({
        code: z.string().min(1).max(10),
        value: z.number().int().positive(),
        optional: z.string().optional(),
      });

      const items = [
        { code: 'A', value: 1 },
        { code: 'B', value: 2, optional: 'test' },
      ];

      const result = parseAndValidateImport(undefined, items, ComplexSchema);

      expect(result).toEqual(items);
    });

    it('should detect duplicates when duplicateKey is provided', () => {
      const items = [
        { code: 'A', value: 1 },
        { code: 'B', value: 2 },
        { code: 'A', value: 3 }, // duplicate code
      ];

      expect(() =>
        parseAndValidateImport(undefined, items, TestSchema, {
          keyExtractor: (item) => item.code,
          keyDescription: 'code',
        }),
      ).toThrow(BadRequestException);
      expect(() =>
        parseAndValidateImport(undefined, items, TestSchema, {
          keyExtractor: (item) => item.code,
          keyDescription: 'code',
        }),
      ).toThrow('Duplicate code found: "A" in rows 1, 3');
    });

    it('should pass when no duplicates and duplicateKey is provided', () => {
      const items = [
        { code: 'A', value: 1 },
        { code: 'B', value: 2 },
        { code: 'C', value: 3 },
      ];

      const result = parseAndValidateImport(undefined, items, TestSchema, {
        keyExtractor: (item) => item.code,
        keyDescription: 'code',
      });

      expect(result).toEqual(items);
    });
  });

  describe('checkForDuplicates', () => {
    it('should not throw when no duplicates', () => {
      const items = [
        { code: 'A', value: 1 },
        { code: 'B', value: 2 },
      ];

      expect(() =>
        checkForDuplicates(items, {
          keyExtractor: (item) => item.code,
          keyDescription: 'code',
        }),
      ).not.toThrow();
    });

    it('should throw on simple duplicate', () => {
      const items = [
        { code: 'A', value: 1 },
        { code: 'A', value: 2 },
      ];

      expect(() =>
        checkForDuplicates(items, {
          keyExtractor: (item) => item.code,
          keyDescription: 'code',
        }),
      ).toThrow('Duplicate code found: "A" in rows 1, 2. Each code must be unique.');
    });

    it('should report multiple occurrences of same duplicate', () => {
      const items = [
        { code: 'A', value: 1 },
        { code: 'A', value: 2 },
        { code: 'A', value: 3 },
      ];

      expect(() =>
        checkForDuplicates(items, {
          keyExtractor: (item) => item.code,
          keyDescription: 'code',
        }),
      ).toThrow('Duplicate code found: "A" in rows 1, 2, 3. Each code must be unique.');
    });

    it('should report multiple different duplicates', () => {
      const items = [
        { code: 'A', value: 1 },
        { code: 'B', value: 2 },
        { code: 'A', value: 3 },
        { code: 'B', value: 4 },
      ];

      expect(() =>
        checkForDuplicates(items, {
          keyExtractor: (item) => item.code,
          keyDescription: 'code',
        }),
      ).toThrow(
        'Duplicate code found: "A" in rows 1, 3; "B" in rows 2, 4. Each code must be unique.',
      );
    });

    it('should limit output to 5 duplicates', () => {
      const items = [
        { code: 'A', value: 1 },
        { code: 'A', value: 2 },
        { code: 'B', value: 3 },
        { code: 'B', value: 4 },
        { code: 'C', value: 5 },
        { code: 'C', value: 6 },
        { code: 'D', value: 7 },
        { code: 'D', value: 8 },
        { code: 'E', value: 9 },
        { code: 'E', value: 10 },
        { code: 'F', value: 11 },
        { code: 'F', value: 12 },
        { code: 'G', value: 13 },
        { code: 'G', value: 14 },
      ];

      expect(() =>
        checkForDuplicates(items, {
          keyExtractor: (item) => item.code,
          keyDescription: 'code',
        }),
      ).toThrow('and 2 more');
    });

    it('should work with composite keys', () => {
      const items = [
        { marketplace: 'ozon', productId: '123' },
        { marketplace: 'wb', productId: '123' },
        { marketplace: 'ozon', productId: '123' }, // duplicate
      ];

      expect(() =>
        checkForDuplicates(items, {
          keyExtractor: (item) => `${item.marketplace}:${item.productId}`,
          keyDescription: 'marketplace+productId',
        }),
      ).toThrow(
        'Duplicate marketplace+productId found: "ozon:123" in rows 1, 3. Each marketplace+productId must be unique.',
      );
    });
  });
});
