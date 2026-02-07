import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { fromCsv, toCsv } from './csv.js';

describe('CSV utilities', () => {
  describe('toCsv', () => {
    it('should convert array to comma-separated CSV', () => {
      const data = [
        { code: 'ABC', title: 'Product A' },
        { code: 'DEF', title: 'Product B' },
      ];
      const result = toCsv(data, ['code', 'title']);
      expect(result).toBe('code,title\nABC,Product A\nDEF,Product B');
    });

    it('should handle values with commas by quoting', () => {
      const data = [{ code: 'ABC', title: 'Product, with comma' }];
      const result = toCsv(data, ['code', 'title']);
      expect(result).toBe('code,title\nABC,"Product, with comma"');
    });

    it('should escape double quotes', () => {
      const data = [{ code: 'ABC', title: 'Product "Special"' }];
      const result = toCsv(data, ['code', 'title']);
      expect(result).toBe('code,title\nABC,"Product ""Special"""');
    });

    it('should handle empty values', () => {
      const data = [
        { code: 'ABC', title: '' },
        { code: '', title: 'Product B' },
      ];
      const result = toCsv(data, ['code', 'title']);
      expect(result).toBe('code,title\nABC,\n,Product B');
    });
  });

  describe('fromCsv', () => {
    describe('comma-delimited CSV', () => {
      it('should parse comma-separated CSV', () => {
        const csv = 'code,title\nABC,Product A\nDEF,Product B';
        const result = fromCsv(csv, ['code', 'title']);
        expect(result).toEqual([
          { code: 'ABC', title: 'Product A' },
          { code: 'DEF', title: 'Product B' },
        ]);
      });

      it('should trim whitespace', () => {
        const csv = 'code,title\n  ABC  ,  Product A  \n  DEF  ,  Product B  ';
        const result = fromCsv(csv, ['code', 'title']);
        expect(result).toEqual([
          { code: 'ABC', title: 'Product A' },
          { code: 'DEF', title: 'Product B' },
        ]);
      });

      it('should skip empty lines', () => {
        const csv = 'code,title\nABC,Product A\n\n\nDEF,Product B\n\n';
        const result = fromCsv(csv, ['code', 'title']);
        expect(result).toEqual([
          { code: 'ABC', title: 'Product A' },
          { code: 'DEF', title: 'Product B' },
        ]);
      });

      it('should handle quoted values with commas', () => {
        const csv = 'code,title\nABC,"Product, with comma"\nDEF,Simple';
        const result = fromCsv(csv, ['code', 'title']);
        expect(result).toEqual([
          { code: 'ABC', title: 'Product, with comma' },
          { code: 'DEF', title: 'Simple' },
        ]);
      });
    });

    describe('semicolon-delimited CSV', () => {
      it('should parse semicolon-separated CSV', () => {
        const csv = 'code;title\nABC;Product A\nDEF;Product B';
        const result = fromCsv(csv, ['code', 'title']);
        expect(result).toEqual([
          { code: 'ABC', title: 'Product A' },
          { code: 'DEF', title: 'Product B' },
        ]);
      });

      it('should handle Cyrillic characters with semicolons', () => {
        const csv = 'code;title\nmavyko;Мавико\nmarshall;MARSHALL';
        const result = fromCsv(csv, ['code', 'title']);
        expect(result).toEqual([
          { code: 'mavyko', title: 'Мавико' },
          { code: 'marshall', title: 'MARSHALL' },
        ]);
      });

      it('should auto-detect delimiter from header', () => {
        const csvComma = 'code,title\nABC,Test';
        const csvSemicolon = 'code;title\nABC;Test';

        const resultComma = fromCsv(csvComma, ['code', 'title']);
        const resultSemicolon = fromCsv(csvSemicolon, ['code', 'title']);

        expect(resultComma).toEqual([{ code: 'ABC', title: 'Test' }]);
        expect(resultSemicolon).toEqual([{ code: 'ABC', title: 'Test' }]);
      });

      it('should detect semicolon when mixed with commas in values', () => {
        // If semicolon is in header, it will be used as delimiter
        const csv = 'code;title\nABC;Product A, with comma\nDEF;Product B';
        const result = fromCsv(csv, ['code', 'title']);
        expect(result).toEqual([
          { code: 'ABC', title: 'Product A, with comma' },
          { code: 'DEF', title: 'Product B' },
        ]);
      });

      it('should handle CSV with UTF-8 BOM', () => {
        // UTF-8 BOM is \uFEFF or bytes EF BB BF
        const csvWithBOM = '\uFEFFcode;title\nABC;Test Product\nDEF;Another';
        const result = fromCsv(csvWithBOM, ['code', 'title']);
        expect(result).toEqual([
          { code: 'ABC', title: 'Test Product' },
          { code: 'DEF', title: 'Another' },
        ]);
      });

      it('should trim whitespace with semicolons', () => {
        const csv = 'code;title\n  ABC  ;  Product A  \n  DEF  ;  Product B  ';
        const result = fromCsv(csv, ['code', 'title']);
        expect(result).toEqual([
          { code: 'ABC', title: 'Product A' },
          { code: 'DEF', title: 'Product B' },
        ]);
      });
    });

    describe('validation', () => {
      it('should throw error for empty content', () => {
        expect(() => fromCsv('', ['code', 'title'])).toThrow(BadRequestException);
      });

      it('should throw error for missing required columns', () => {
        const csv = 'code,title\nABC,Product A\n,Product B';
        expect(() => fromCsv(csv, ['code', 'title'])).toThrow(
          'Row 3: "code" is required but empty or missing',
        );
      });

      it('should throw error when column missing in header', () => {
        const csv = 'code\nABC\nDEF';
        expect(() => fromCsv(csv, ['code', 'title'])).toThrow(BadRequestException);
      });

      it('should throw error for non-string content', () => {
        // biome-ignore lint/suspicious/noExplicitAny: testing invalid input types
        expect(() => fromCsv(null as any, ['code'])).toThrow('Content must be a non-empty string');
        // biome-ignore lint/suspicious/noExplicitAny: testing invalid input types
        expect(() => fromCsv(123 as any, ['code'])).toThrow('Content must be a non-empty string');
      });

      it('should validate all rows have required values', () => {
        const csv = 'code;title\nABC;Product A\nDEF;\nGHI;Product C';
        expect(() => fromCsv(csv, ['code', 'title'])).toThrow(
          'Row 3: "title" is required but empty or missing',
        );
      });
    });

    describe('tricky CSV cases', () => {
      it('should handle quoted values with semicolons inside (semicolon delimiter)', () => {
        const csv = 'code;title\nABC;"Product A; special"\nDEF;Simple';
        const result = fromCsv(csv, ['code', 'title']);
        expect(result).toEqual([
          { code: 'ABC', title: 'Product A; special' },
          { code: 'DEF', title: 'Simple' },
        ]);
      });

      it('should handle embedded newlines in quoted fields', () => {
        const csv = 'code;title\nABC;"Line 1\nLine 2"\nDEF;Simple';
        const result = fromCsv(csv, ['code', 'title']);
        expect(result).toEqual([
          { code: 'ABC', title: 'Line 1\nLine 2' },
          { code: 'DEF', title: 'Simple' },
        ]);
      });

      it('should handle escaped quotes inside quoted fields', () => {
        const csv = 'code;title\nABC;"Product ""Special"" Edition"\nDEF;Normal';
        const result = fromCsv(csv, ['code', 'title']);
        expect(result).toEqual([
          { code: 'ABC', title: 'Product "Special" Edition' },
          { code: 'DEF', title: 'Normal' },
        ]);
      });

      it('should handle mixed: semicolons, newlines, and quotes in one field', () => {
        const csv =
          'code;title;description\nABC;"Title A";"Line 1; with semi\nLine 2 ""quoted"""\nDEF;Title B;Simple';
        const result = fromCsv(csv, ['code', 'title']);
        expect(result).toEqual([
          { code: 'ABC', title: 'Title A', description: 'Line 1; with semi\nLine 2 "quoted"' },
          { code: 'DEF', title: 'Title B', description: 'Simple' },
        ]);
      });

      it('should handle CRLF line endings', () => {
        const csv = 'code;title\r\nABC;Product A\r\nDEF;Product B\r\n';
        const result = fromCsv(csv, ['code', 'title']);
        expect(result).toEqual([
          { code: 'ABC', title: 'Product A' },
          { code: 'DEF', title: 'Product B' },
        ]);
      });

      it('should handle real-world product with car models in description', () => {
        const csv = `code;title;description
M412001;"Тормозные диски";"KIA RIO III 11-, RIO IV 17-; HYUNDAI ACCENT SOLARIS I 10-17, SOLARIS II 17-"`;
        const result = fromCsv(csv, ['code', 'title']);
        expect(result).toEqual([
          {
            code: 'M412001',
            title: 'Тормозные диски',
            description:
              'KIA RIO III 11-, RIO IV 17-; HYUNDAI ACCENT SOLARIS I 10-17, SOLARIS II 17-',
          },
        ]);
      });
    });

    describe('real-world examples', () => {
      it('should parse brands CSV with semicolons', () => {
        const brandsCSV = `code;title
mavyko;Мавико
marshall;MARSHALL
mazda;Mazda
masuma;Masuma
optimalparts;OptimalParts`;

        const result = fromCsv(brandsCSV, ['code', 'title']);
        expect(result).toHaveLength(5);
        expect(result[0]).toEqual({ code: 'mavyko', title: 'Мавико' });
        expect(result[4]).toEqual({ code: 'optimalparts', title: 'OptimalParts' });
      });

      it('should parse products CSV with commas', () => {
        const productsCSV = `code,title
LAPTOP-001,Dell XPS 15
PHONE-002,iPhone 13 Pro
TABLET-003,iPad Air`;

        const result = fromCsv(productsCSV, ['code', 'title']);
        expect(result).toHaveLength(3);
        expect(result[1]).toEqual({ code: 'PHONE-002', title: 'iPhone 13 Pro' });
      });

      it('should allow rows with fewer columns than header (optional fields)', () => {
        // Header has 4 columns, but rows only have required fields (code, title)
        const csv = `code;title;category;status
SKU-001;Product A
SKU-002;Product B;electronics
SKU-003;Product C;electronics;active`;

        const result = fromCsv(csv, ['code', 'title']);
        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({ code: 'SKU-001', title: 'Product A' });
        expect(result[1]).toEqual({ code: 'SKU-002', title: 'Product B', category: 'electronics' });
        expect(result[2]).toEqual({
          code: 'SKU-003',
          title: 'Product C',
          category: 'electronics',
          status: 'active',
        });
      });
    });
  });
});
