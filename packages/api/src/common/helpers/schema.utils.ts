import { z } from 'zod';

/**
 * Type helper that ensures Zod-inferred types are compatible with shared DTOs.
 * Fails at compile time if types drift out of sync.
 *
 * @example
 * type CreateSkuDto = AssertCompatible<SharedCreateSkuDto, z.infer<typeof CreateSkuSchema>>;
 */
export type AssertCompatible<T, U extends T> = U;

/**
 * Parse period from various formats to YYYY-MM
 * Accepts: YYYY-MM, DD.MM.YYYY, DD/MM/YYYY
 */
function parsePeriod(value: string): string {
  // Already in YYYY-MM format
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return value;
  }
  // DD.MM.YYYY or DD/MM/YYYY format
  const match = value.match(/^\d{1,2}[./](\d{1,2})[./](\d{4})$/);
  if (match?.[1] && match[2]) {
    const month = match[1].padStart(2, '0');
    const year = match[2];
    return `${year}-${month}`;
  }
  return value; // Return as-is, let validation fail
}

/**
 * Parse int from string, returns the parsed value.
 * For validation, we use parseFloat to detect non-integer strings like '1.5'
 */
function parseFlexibleInt(value: string | number): number {
  if (typeof value === 'number') return value;
  // Use parseFloat to properly detect decimal values like '1.5'
  // parseInt('1.5') would truncate to 1, which is not what we want for validation
  return Number.parseFloat(value.replace(/[\s,]/g, ''));
}

/**
 * Parse float from string, handling comma as decimal separator
 */
function parseFlexibleFloat(value: string | number): number {
  if (typeof value === 'number') return value;
  // Replace comma with dot for European format
  return Number.parseFloat(value.replace(',', '.'));
}

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

  /** Non-negative integer from string (for CSV imports) */
  flexibleQuantity: () =>
    z
      .union([z.number(), z.string()])
      .transform(parseFlexibleInt)
      .pipe(z.number().int().nonnegative()),

  /** Month number 1-12 */
  month: () => z.number().int().min(1).max(12),

  /** Month number 1-12, coerced from string (for imports) */
  flexibleMonth: () => z.coerce.number().int().min(1).max(12),

  /** Positive number (for coefficients, prices, etc.) */
  coefficient: () => z.number().positive(),

  /** YYYY-MM period format (strict, for API responses) */
  period: () => z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Must be in YYYY-MM format'),

  /** Flexible period format for imports: YYYY-MM, DD.MM.YYYY, DD/MM/YYYY */
  flexiblePeriod: () =>
    z
      .string()
      .transform(parsePeriod)
      .pipe(z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Must be a valid period (YYYY-MM, DD.MM.YYYY, or DD/MM/YYYY)')),

  /** Flexible float for imports: handles comma decimal separator */
  flexibleFloat: () =>
    z
      .union([z.number(), z.string()])
      .transform(parseFlexibleFloat)
      .pipe(z.number().positive()),
};
