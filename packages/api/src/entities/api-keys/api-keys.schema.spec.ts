import { describe, expect, it } from 'vitest';
import { CreateApiKeySchema, UpdateApiKeySchema } from './api-keys.schema.js';

describe('ApiKey Schemas', () => {
  describe('CreateApiKeySchema', () => {
    it('should validate valid API key creation with userId only', () => {
      const data = {
        userId: 1,
      };

      const result = CreateApiKeySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate with all optional fields', () => {
      const data = {
        userId: 1,
        name: 'Production Key',
        expiresAt: '2025-12-31T23:59:59Z',
      };

      const result = CreateApiKeySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject negative userId', () => {
      const data = {
        userId: -1,
      };

      expect(() => CreateApiKeySchema.parse(data)).toThrow();
    });

    it('should reject zero userId', () => {
      const data = {
        userId: 0,
      };

      expect(() => CreateApiKeySchema.parse(data)).toThrow();
    });

    it('should reject invalid expiresAt format', () => {
      const data = {
        userId: 1,
        expiresAt: '2025-12-31', // Not ISO datetime
      };

      expect(() => CreateApiKeySchema.parse(data)).toThrow();
    });

    it('should accept valid ISO datetime for expiresAt', () => {
      const data = {
        userId: 1,
        expiresAt: '2025-12-31T00:00:00.000Z',
      };

      const result = CreateApiKeySchema.parse(data);

      expect(result).toEqual(data);
    });
  });

  describe('UpdateApiKeySchema', () => {
    it('should validate partial update with name only', () => {
      const data = { name: 'New Key Name' };

      const result = UpdateApiKeySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate partial update with expiresAt only', () => {
      const data = { expiresAt: '2026-12-31T23:59:59Z' };

      const result = UpdateApiKeySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty object', () => {
      const data = {};

      const result = UpdateApiKeySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow null name', () => {
      const data = { name: null };

      const result = UpdateApiKeySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow null expiresAt', () => {
      const data = { expiresAt: null };

      const result = UpdateApiKeySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject invalid expiresAt format on update', () => {
      const data = { expiresAt: 'not-a-datetime' };

      expect(() => UpdateApiKeySchema.parse(data)).toThrow();
    });
  });
});
