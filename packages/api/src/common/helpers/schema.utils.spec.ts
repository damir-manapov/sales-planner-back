import { describe, expect, it } from 'vitest';
import { zodSchemas } from './schema.utils.js';

describe('zodSchemas', () => {
  describe('flexiblePeriod', () => {
    const schema = zodSchemas.flexiblePeriod();

    it('should accept YYYY-MM format', () => {
      expect(schema.parse('2024-01')).toBe('2024-01');
      expect(schema.parse('2024-12')).toBe('2024-12');
    });

    it('should convert DD.MM.YYYY format', () => {
      expect(schema.parse('15.01.2024')).toBe('2024-01');
      expect(schema.parse('01.12.2024')).toBe('2024-12');
      expect(schema.parse('1.1.2024')).toBe('2024-01');
    });

    it('should convert DD/MM/YYYY format', () => {
      expect(schema.parse('15/01/2024')).toBe('2024-01');
      expect(schema.parse('01/12/2024')).toBe('2024-12');
    });

    it('should reject invalid formats', () => {
      expect(() => schema.parse('invalid')).toThrow();
      expect(() => schema.parse('2024-13')).toThrow();
      expect(() => schema.parse('2024-00')).toThrow();
      expect(() => schema.parse('01-2024')).toThrow();
    });
  });

  describe('flexibleFloat', () => {
    const schema = zodSchemas.flexibleFloat();

    it('should accept numbers', () => {
      expect(schema.parse(1.5)).toBe(1.5);
      expect(schema.parse(42)).toBe(42);
    });

    it('should accept strings with dot decimal separator', () => {
      expect(schema.parse('1.5')).toBe(1.5);
      expect(schema.parse('42.0')).toBe(42);
    });

    it('should accept strings with comma decimal separator', () => {
      expect(schema.parse('1,5')).toBe(1.5);
      expect(schema.parse('42,123')).toBe(42.123);
    });

    it('should reject zero or negative numbers', () => {
      expect(() => schema.parse(0)).toThrow();
      expect(() => schema.parse(-1)).toThrow();
      expect(() => schema.parse('0')).toThrow();
      expect(() => schema.parse('-1.5')).toThrow();
    });

    it('should reject non-numeric strings', () => {
      expect(() => schema.parse('not a number')).toThrow();
    });
  });

  describe('flexibleQuantity', () => {
    const schema = zodSchemas.flexibleQuantity();

    it('should accept numbers', () => {
      expect(schema.parse(0)).toBe(0);
      expect(schema.parse(42)).toBe(42);
      expect(schema.parse(100)).toBe(100);
    });

    it('should accept string integers', () => {
      expect(schema.parse('0')).toBe(0);
      expect(schema.parse('42')).toBe(42);
      expect(schema.parse('100')).toBe(100);
    });

    it('should reject negative numbers', () => {
      expect(() => schema.parse(-1)).toThrow();
      expect(() => schema.parse('-1')).toThrow();
    });

    it('should reject non-integer numbers', () => {
      expect(() => schema.parse(1.5)).toThrow();
      expect(() => schema.parse('1.5')).toThrow();
    });

    it('should reject non-numeric strings', () => {
      expect(() => schema.parse('not a number')).toThrow();
    });
  });
});
