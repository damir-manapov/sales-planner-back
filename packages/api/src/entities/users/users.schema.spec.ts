import { describe, expect, it } from 'vitest';
import { CreateUserSchema, UpdateUserSchema } from './users.schema.js';

describe('User Schemas', () => {
  describe('CreateUserSchema', () => {
    it('should validate valid user creation data', () => {
      const data = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const result = CreateUserSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate with optional default_shop_id', () => {
      const data = {
        email: 'test@example.com',
        name: 'Test User',
        default_shop_id: 1,
      };

      const result = CreateUserSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject invalid email', () => {
      const data = {
        email: 'invalid-email',
        name: 'Test User',
      };

      expect(() => CreateUserSchema.parse(data)).toThrow();
    });

    it('should reject empty email', () => {
      const data = {
        email: '',
        name: 'Test User',
      };

      expect(() => CreateUserSchema.parse(data)).toThrow();
    });

    it('should reject empty name', () => {
      const data = {
        email: 'test@example.com',
        name: '',
      };

      expect(() => CreateUserSchema.parse(data)).toThrow();
    });

    it('should reject name longer than 255 characters', () => {
      const data = {
        email: 'test@example.com',
        name: 'A'.repeat(256),
      };

      expect(() => CreateUserSchema.parse(data)).toThrow();
    });

    it('should reject negative default_shop_id', () => {
      const data = {
        email: 'test@example.com',
        name: 'Test User',
        default_shop_id: -1,
      };

      expect(() => CreateUserSchema.parse(data)).toThrow();
    });

    it('should reject zero default_shop_id', () => {
      const data = {
        email: 'test@example.com',
        name: 'Test User',
        default_shop_id: 0,
      };

      expect(() => CreateUserSchema.parse(data)).toThrow();
    });
  });

  describe('UpdateUserSchema', () => {
    it('should validate partial update with email only', () => {
      const data = { email: 'new@example.com' };

      const result = UpdateUserSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate partial update with name only', () => {
      const data = { name: 'New Name' };

      const result = UpdateUserSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty object', () => {
      const data = {};

      const result = UpdateUserSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow null default_shop_id', () => {
      const data = { default_shop_id: null };

      const result = UpdateUserSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject invalid email on update', () => {
      const data = { email: 'not-an-email' };

      expect(() => UpdateUserSchema.parse(data)).toThrow();
    });
  });
});
