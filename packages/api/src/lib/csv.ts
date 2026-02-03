import { BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';

/**
 * Converts an array of objects to CSV string format
 */
export function toCsv<T extends Record<string, unknown>>(
  items: T[],
  columns: Array<keyof T>,
): string {
  const header = columns.join(',');
  const rows = items.map((item) => {
    return columns
      .map((col) => {
        const value = item[col];
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        // Escape double quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });
  return [header, ...rows].join('\n');
}

/**
 * Parses CSV content and validates required columns
 */
export function fromCsv<T extends Record<string, string>>(
  content: string,
  requiredColumns: string[],
): T[] {
  if (!content || typeof content !== 'string') {
    throw new BadRequestException('Content must be a non-empty string');
  }

  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>;

    // Validate required columns exist
    for (const record of records) {
      for (const column of requiredColumns) {
        if (!(column in record) || !record[column]) {
          throw new BadRequestException(`CSV must have a "${column}" column with values`);
        }
      }
    }

    return records as T[];
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException(
      `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
