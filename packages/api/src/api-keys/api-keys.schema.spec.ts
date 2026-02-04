import { describe, expect, it } from 'vitest';
import { CreateApiKeySchema, UpdateApiKeySchema } from './api-keys.schema.js';

describe('ApiKey Schemas', () => {
  describe('CreateApiKeySchema', () => {
    it('should validate valid API key creation with user_id only', () => {
      const data = {
        user_id: 1,
      };

      const result = CreateApiKeySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate with all optional fields', () => {
      const data = {
        user_id: 1,
        key: 'sk_test_12345',
        name: 'Production Key',
        expires_at: '2025-12-31T23:59:59Z',
      };

      const result = CreateApiKeySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject negative user_id', () => {
      const data = {
        user_id: -1,
      };

      expect(() => CreateApiKeySchema.parse(data)).toThrow();
    });

    it('should reject zero user_id', () => {
      const data = {
        user_id: 0,
      };

      expect(() => CreateApiKeySchema.parse(data)).toThrow();
    });

    it('should reject empty key', () => {
      const data = {
        user_id: 1,
        key: '',
      };

      expect(() => CreateApiKeySchema.parse(data)).toThrow();
    });

    it('should reject key longer than 255 characters', () => {
      const data = {
        user_id: 1,
        key: 'A'.repeat(256),
      };

      expect(() => CreateApiKeySchema.parse(data)).toThrow();
    });

    it('should reject invalid expires_at format', () => {
      const data = {
        user_id: 1,
        expires_at: '2025-12-31', // Not ISO datetime
      };

      expect(() => CreateApiKeySchema.parse(data)).toThrow();
    });

    it('should accept valid ISO datetime for expires_at', () => {
      const data = {
        user_id: 1,
        expires_at: '2025-12-31T00:00:00.000Z',
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

    it('should validate partial update with expires_at only', () => {
      const data = { expires_at: '2026-12-31T23:59:59Z' };

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

    it('should allow null expires_at', () => {
      const data = { expires_at: null };

      const result = UpdateApiKeySchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject invalid expires_at format on update', () => {
      const data = { expires_at: 'not-a-datetime' };

      expect(() => UpdateApiKeySchema.parse(data)).toThrow();
    });
  });
});
