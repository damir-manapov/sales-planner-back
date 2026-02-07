import { BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';
import { fromCsv, toCsv } from '../../lib/index.js';

// Use a minimal interface that works with Express Response
// This avoids needing @types/express in production builds
export interface ExpressResponse {
  setHeader(name: string, value: string): unknown;
  json(body: unknown): unknown;
  send(body: unknown): unknown;
}

/**
 * Options for duplicate key detection
 */
export interface DuplicateKeyOptions<T> {
  /** Function to extract the unique key from an item */
  keyExtractor: (item: T) => string;
  /** Human-readable name for what the key represents (e.g., "code", "marketplace+productId") */
  keyDescription: string;
}

/**
 * Check for duplicate keys in an array and throw a BadRequestException with details.
 * @param items Array of items to check
 * @param options Options for key extraction and description
 * @throws BadRequestException if duplicates are found
 */
export function checkForDuplicates<T>(items: T[], options: DuplicateKeyOptions<T>): void {
  const { keyExtractor, keyDescription } = options;
  const seen = new Map<string, number>(); // key -> first row number (1-based)
  const duplicates: Array<{ key: string; rows: number[] }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as T;
    const key = keyExtractor(item);
    const rowNum = i + 1; // 1-based row number (header is row 0 in CSV)

    if (seen.has(key)) {
      // Find existing duplicate entry or create new one
      const existing = duplicates.find((d) => d.key === key);
      if (existing) {
        existing.rows.push(rowNum);
      } else {
        duplicates.push({ key, rows: [seen.get(key)!, rowNum] });
      }
    } else {
      seen.set(key, rowNum);
    }
  }

  if (duplicates.length > 0) {
    const details = duplicates
      .slice(0, 5) // Show max 5 duplicates to avoid huge error messages
      .map((d) => `"${d.key}" in rows ${d.rows.join(', ')}`)
      .join('; ');
    const moreText = duplicates.length > 5 ? ` and ${duplicates.length - 5} more` : '';
    throw new BadRequestException(
      `Duplicate ${keyDescription} found: ${details}${moreText}. Each ${keyDescription} must be unique.`,
    );
  }
}

/**
 * Helper to send JSON export with proper headers
 * Use with @Header decorators in controller
 */
export function sendJsonExport<T>(res: ExpressResponse, data: T[], filename: string): void {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json(data);
}

/**
 * Helper to send CSV export with proper headers
 * Use with @Header decorators in controller
 */
export function sendCsvExport<T extends object>(
  res: ExpressResponse,
  data: T[],
  filename: string,
  columns?: Array<keyof T>,
): void {
  const csv = columns
    ? toCsv(data, columns)
    : toCsv(data, Object.keys(data[0] || {}) as Array<keyof T>);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

/**
 * Parse CSV file or body content for import
 */
export function parseCsvImport<T extends Record<string, string>>(
  file: Express.Multer.File | undefined,
  body: string | undefined,
  requiredColumns: string[],
): T[] {
  let csvContent: string;

  if (file) {
    csvContent = file.buffer.toString('utf-8');
  } else if (body) {
    csvContent = body;
  } else {
    throw new BadRequestException('Either file or CSV body is required');
  }

  return fromCsv<T>(csvContent, requiredColumns);
}

/**
 * Parse CSV file and validate each row with Zod schema.
 * All values are passed as strings to the schema, which should handle
 * type conversions (e.g., flexibleFloat for numbers with comma separators).
 *
 * @param file - Multer file upload
 * @param body - Raw CSV body string
 * @param requiredColumns - Columns that must be present in CSV
 * @param schema - Zod schema for validating each row
 * @param duplicateKey - Optional duplicate key detection options
 */
export function parseCsvAndValidateImport<T>(
  file: Express.Multer.File | undefined,
  body: string | undefined,
  requiredColumns: string[],
  schema: ZodType<T>,
  duplicateKey?: DuplicateKeyOptions<T>,
): T[] {
  const records = parseCsvImport<Record<string, string>>(file, body, requiredColumns);

  const validated = records.map((record, index) => {
    try {
      return schema.parse(record);
    } catch (error) {
      throw new BadRequestException(`Invalid data at row ${index + 1}: ${error}`);
    }
  });

  // Check for duplicates if key extractor provided
  if (duplicateKey) {
    checkForDuplicates(validated, duplicateKey);
  }

  return validated;
}
