import { z } from 'zod';

/**
 * Type helper that ensures Zod-inferred types are compatible with shared DTOs.
 * Fails at compile time if types drift out of sync.
 *
 * @example
 * type CreateSkuDto = AssertCompatible<SharedCreateSkuDto, z.infer<typeof CreateSkuSchema>>;
 */
export type AssertCompatible<T, U extends T> = U;

// Common Zod schema patterns
export const zodSchemas = {
  /** Standard title field: 1-255 chars */
  title: () => z.string().min(1).max(255),

  /** Standard name field: 1-255 chars */
  name: () => z.string().min(1).max(255),

  /** Email field with max length */
  email: () => z.string().email().max(255),

  /** Short code field: 1-100 chars */
  code: () => z.string().min(1).max(100),

  /** Short identifier: 1-50 chars */
  shortId: () => z.string().min(1).max(50),

  /** Description field: up to 500 chars */
  description: () => z.string().max(500),

  /** Positive integer ID (for foreign keys) */
  id: () => z.number().int().positive(),

  /** Non-negative integer (for quantities) */
  quantity: () => z.number().int().nonnegative(),

  /** YYYY-MM period format */
  period: () => z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Must be in YYYY-MM format'),
};
