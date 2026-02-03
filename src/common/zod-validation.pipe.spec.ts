import { type ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe.js';

describe('ZodValidationPipe', () => {
  const TestSchema = z.object({
    name: z.string().min(1).max(10),
    age: z.number().int().positive(),
    email: z.string().email().optional(),
  });

  it('should pass valid data through', () => {
    const pipe = new ZodValidationPipe(TestSchema);
    const data = { name: 'John', age: 30 };

    const result = pipe.transform(data, { type: 'body' } as ArgumentMetadata);

    expect(result).toEqual(data);
  });

  it('should throw BadRequestException on validation failure', () => {
    const pipe = new ZodValidationPipe(TestSchema);
    const data = { name: '', age: 30 };

    expect(() => pipe.transform(data, { type: 'body' } as ArgumentMetadata)).toThrow(
      BadRequestException,
    );
  });

  it('should provide detailed error messages', () => {
    const pipe = new ZodValidationPipe(TestSchema);
    const data = { name: 'ThisIsAVeryLongNameThatExceedsTenCharacters', age: -5 };

    try {
      pipe.transform(data, { type: 'body' } as ArgumentMetadata);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        message: string;
        errors: string[];
      };
      expect(response.message).toBe('Validation failed');
      expect(response.errors).toBeInstanceOf(Array);
      expect(response.errors.length).toBeGreaterThan(0);
    }
  });

  it('should validate nested objects', () => {
    const NestedSchema = z.object({
      user: z.object({
        name: z.string(),
        age: z.number(),
      }),
      settings: z.object({
        theme: z.enum(['light', 'dark']),
      }),
    });

    const pipe = new ZodValidationPipe(NestedSchema);
    const data = {
      user: { name: 'Jane', age: 25 },
      settings: { theme: 'dark' },
    };

    const result = pipe.transform(data, { type: 'body' } as ArgumentMetadata);

    expect(result).toEqual(data);
  });

  it('should handle array validation', () => {
    const ArraySchema = z.array(z.string().min(1));
    const pipe = new ZodValidationPipe(ArraySchema);
    const data = ['a', 'b', 'c'];

    const result = pipe.transform(data, { type: 'body' } as ArgumentMetadata);

    expect(result).toEqual(data);
  });

  it('should include field path in error message', () => {
    const NestedSchema = z.object({
      user: z.object({
        email: z.string().email(),
      }),
    });

    const pipe = new ZodValidationPipe(NestedSchema);
    const data = { user: { email: 'invalid-email' } };

    try {
      pipe.transform(data, { type: 'body' } as ArgumentMetadata);
      expect.fail('Should have thrown');
    } catch (error) {
      const response = (error as BadRequestException).getResponse() as { errors: string[] };
      expect(response.errors[0]).toContain('user.email');
    }
  });

  it('should handle optional fields', () => {
    const pipe = new ZodValidationPipe(TestSchema);
    const data = { name: 'John', age: 30 };

    const result = pipe.transform(data, { type: 'body' } as ArgumentMetadata);

    expect(result).toEqual(data);
    expect(result).not.toHaveProperty('email');
  });

  it('should validate email format when provided', () => {
    const pipe = new ZodValidationPipe(TestSchema);
    const data = { name: 'John', age: 30, email: 'invalid-email' };

    expect(() => pipe.transform(data, { type: 'body' } as ArgumentMetadata)).toThrow(
      BadRequestException,
    );
  });

  it('should accept valid email', () => {
    const pipe = new ZodValidationPipe(TestSchema);
    const data = { name: 'John', age: 30, email: 'john@example.com' };

    const result = pipe.transform(data, { type: 'body' } as ArgumentMetadata);

    expect(result).toEqual(data);
  });

  it('should handle schema with refinements', () => {
    const RefinedSchema = z
      .object({
        password: z.string().min(8),
        confirmPassword: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
      });

    const pipe = new ZodValidationPipe(RefinedSchema);
    const invalidData = { password: 'password123', confirmPassword: 'different' };

    expect(() => pipe.transform(invalidData, { type: 'body' } as ArgumentMetadata)).toThrow(
      BadRequestException,
    );
  });
});
