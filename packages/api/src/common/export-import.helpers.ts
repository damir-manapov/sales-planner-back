import type { Response as ExpressResponse } from 'express';
import { fromCsv, toCsv } from '../lib/index.js';

/**
 * Helper to send JSON export with proper headers
 * Use with @Header decorators in controller
 */
export function sendJsonExport<T>(res: ExpressResponse, data: T[], filename: string): void {
  (res as any).setHeader('Content-Type', 'application/json');
  (res as any).setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  (res as any).json(data);
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
  (res as any).setHeader('Content-Type', 'text/csv');
  (res as any).setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  (res as any).send(csv);
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
    throw new Error('Either file or CSV body is required');
  }

  return fromCsv<T>(csvContent, requiredColumns);
}
