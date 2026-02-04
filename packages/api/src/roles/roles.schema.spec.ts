import { describe, expect, it } from 'vitest';
import { CreateRoleSchema, UpdateRoleSchema } from './roles.schema.js';

describe('Role Schemas', () => {
  describe('CreateRoleSchema', () => {
    it('should validate valid role creation data', () => {
      const data = {
        name: 'admin',
      };

      const result = CreateRoleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate with optional description', () => {
      const data = {
        name: 'admin',
        description: 'Administrator role with full access',
      };

      const result = CreateRoleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty name', () => {
      const data = {
        name: '',
      };

      expect(() => CreateRoleSchema.parse(data)).toThrow();
    });

    it('should reject name longer than 100 characters', () => {
      const data = {
        name: 'A'.repeat(101),
      };

      expect(() => CreateRoleSchema.parse(data)).toThrow();
    });

    it('should reject description longer than 500 characters', () => {
      const data = {
        name: 'admin',
        description: 'A'.repeat(501),
      };

      expect(() => CreateRoleSchema.parse(data)).toThrow();
    });
  });

  describe('UpdateRoleSchema', () => {
    it('should validate partial update with name only', () => {
      const data = { name: 'new-role' };

      const result = UpdateRoleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should validate partial update with description only', () => {
      const data = { description: 'New description' };

      const result = UpdateRoleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty object', () => {
      const data = {};

      const result = UpdateRoleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow null description', () => {
      const data = { description: null };

      const result = UpdateRoleSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty name on update', () => {
      const data = { name: '' };

      expect(() => UpdateRoleSchema.parse(data)).toThrow();
    });
  });
});
