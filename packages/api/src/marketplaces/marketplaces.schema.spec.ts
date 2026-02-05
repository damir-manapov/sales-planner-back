import { describe, expect, it } from 'vitest';
import { CreateMarketplaceSchema, UpdateMarketplaceSchema } from './marketplaces.schema.js';

describe('Marketplace Schemas', () => {
  describe('CreateMarketplaceSchema', () => {
    it('should validate valid marketplace creation data', () => {
      const data = {
        code: 'amazon',
        title: 'Amazon',
      };

      const result = CreateMarketplaceSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty code', () => {
      const data = {
        code: '',
        title: 'Amazon',
      };

      expect(() => CreateMarketplaceSchema.parse(data)).toThrow();
    });

    it('should reject code longer than 50 characters', () => {
      const data = {
        code: 'A'.repeat(51),
        title: 'Amazon',
      };

      expect(() => CreateMarketplaceSchema.parse(data)).toThrow();
    });

    it('should reject empty title', () => {
      const data = {
        code: 'amazon',
        title: '',
      };

      expect(() => CreateMarketplaceSchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters', () => {
      const data = {
        code: 'amazon',
        title: 'A'.repeat(256),
      };

      expect(() => CreateMarketplaceSchema.parse(data)).toThrow();
    });

    it('should reject missing code', () => {
      const data = {
        title: 'Amazon',
      };

      expect(() => CreateMarketplaceSchema.parse(data)).toThrow();
    });

    it('should reject missing title', () => {
      const data = {
        code: 'amazon',
      };

      expect(() => CreateMarketplaceSchema.parse(data)).toThrow();
    });
  });

  describe('UpdateMarketplaceSchema', () => {
    it('should validate partial update with title', () => {
      const data = { title: 'New Title' };

      const result = UpdateMarketplaceSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should allow empty object', () => {
      const data = {};

      const result = UpdateMarketplaceSchema.parse(data);

      expect(result).toEqual(data);
    });

    it('should reject empty title on update', () => {
      const data = { title: '' };

      expect(() => UpdateMarketplaceSchema.parse(data)).toThrow();
    });

    it('should reject title longer than 255 characters on update', () => {
      const data = { title: 'A'.repeat(256) };

      expect(() => UpdateMarketplaceSchema.parse(data)).toThrow();
    });
  });
});
