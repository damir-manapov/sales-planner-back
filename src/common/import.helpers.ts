import { BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

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
export function validateArray<T>(data: unknown[], schema: ZodSchema<T>): T[] {
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
 */
export function parseAndValidateImport<T>(
  file: Express.Multer.File | undefined,
  bodyItems: unknown[] | undefined,
  schema: ZodSchema<T>,
): T[] {
  const data = parseImportData(file, bodyItems);
  return validateArray(data, schema);
}
