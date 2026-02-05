import { fromCsv, toCsv } from '../lib/index.js';

// Use a minimal interface that works with Express Response
// This avoids needing @types/express in production builds
interface ExpressResponse {
  setHeader(name: string, value: string): this;
  json(body: unknown): this;
  send(body: unknown): this;
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
    throw new Error('Either file or CSV body is required');
  }

  return fromCsv<T>(csvContent, requiredColumns);
}
