import { BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';
import { checkForDuplicates, type DuplicateKeyOptions } from './export-import.helpers.js';

/**
 * Parse import data from either file upload or JSON body
 */
export function parseImportData<T>(
  file: Express.Multer.File | undefined,
  bodyItems: T[] | undefined,
): T[] {
  let data: T[];

  if (file) {
    // File upload
    const content = file.buffer.toString('utf-8');
    data = JSON.parse(content) as T[];
  } else if (bodyItems) {
    // JSON body
    data = bodyItems;
  } else {
    throw new BadRequestException('Either file or JSON body is required');
  }

  if (!Array.isArray(data)) {
    throw new BadRequestException('Data must be an array');
  }

  return data;
}

/**
 * Validate array of items against Zod schema
 */
export function validateArray<T>(data: unknown[], schema: ZodType<T>): T[] {
  return data.map((item, index) => {
    try {
      return schema.parse(item);
    } catch (error) {
      throw new BadRequestException(`Invalid item at index ${index}: ${error}`);
    }
  });
}

/**
 * Combined helper for parsing and validating import data
 * @param file - Multer file upload
 * @param bodyItems - JSON body array
 * @param schema - Zod schema for validating each item
 * @param duplicateKey - Optional duplicate key detection options
 */
export function parseAndValidateImport<T>(
  file: Express.Multer.File | undefined,
  bodyItems: unknown[] | undefined,
  schema: ZodType<T>,
  duplicateKey?: DuplicateKeyOptions<T>,
): T[] {
  const data = parseImportData(file, bodyItems);
  const validated = validateArray(data, schema);

  // Check for duplicates if key extractor provided
  if (duplicateKey) {
    checkForDuplicates(validated, duplicateKey);
  }

  return validated;
}
