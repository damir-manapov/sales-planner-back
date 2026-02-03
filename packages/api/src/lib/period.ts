/**
 * Period utility functions for handling "YYYY-MM" format dates.
 * Periods are stored as first-of-month dates in the database.
 */

/** Convert "YYYY-MM" to Date (first of month, UTC) */
export function periodToDate(period: string): Date {
  const parts = period.split('-').map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  return new Date(Date.UTC(year, month - 1, 1));
}

/** Convert Date to "YYYY-MM" */
export function dateToPeriod(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Validate period format "YYYY-MM" */
export function isValidPeriod(period: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(period)) return false;
  const parts = period.split('-').map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 0;
  return month >= 1 && month <= 12 && year >= 1900 && year <= 9999;
}
