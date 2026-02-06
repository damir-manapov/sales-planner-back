import { BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';

/**
 * Converts an array of objects to CSV string format
 */
export function toCsv<T extends object>(items: T[], columns: ReadonlyArray<keyof T>): string {
  const header = columns.map(String).join(',');
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
 * Supports both comma and semicolon delimiters
 */
export function fromCsv<T extends Record<string, string>>(
  content: string,
  requiredColumns: string[],
): T[] {
  if (!content || typeof content !== 'string') {
    throw new BadRequestException('Content must be a non-empty string');
  }

  try {
    // Strip UTF-8 BOM if present
    const cleanContent = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;

    // Auto-detect delimiter by checking first line
    const firstLine = cleanContent.split('\n')[0];
    const delimiter = firstLine?.includes(';') ? ';' : ',';

    const records = parse(cleanContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter,
      bom: true, // Handle BOM at parser level too
      relax_column_count: true, // Allow rows with fewer columns than header (for optional fields)
    }) as Array<Record<string, string>>;

    // Filter out empty records (all values empty or whitespace)
    const nonEmptyRecords = records.filter((record) => {
      return Object.values(record).some((value) => value && value.trim() !== '');
    });

    // Validate required columns exist in non-empty records
    for (const record of nonEmptyRecords) {
      for (const column of requiredColumns) {
        if (!(column in record) || !record[column]) {
          throw new BadRequestException(`CSV must have a "${column}" column with values`);
        }
      }
    }

    return nonEmptyRecords as T[];
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException(
      `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
