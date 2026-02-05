import { type INestApplication } from '@nestjs/common';
import { Kysely } from 'kysely';
import { expect } from 'vitest';
import { ApiError } from '@sales-planner/http-client';
import { DatabaseService } from '../src/database/database.service.js';
import type { DB } from '../src/database/database.types.js';

/**
 * System admin key for test authentication
 */
export const SYSTEM_ADMIN_KEY = process.env.SYSTEM_ADMIN_KEY ?? '';

/**
 * Generate a unique identifier for tests to avoid collisions in parallel execution.
 * Format: `{timestamp}-{random9chars}` (e.g., "1738782000000-abc123def")
 */
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generate a random test period (YYYY-MM format) to avoid conflicts.
 * Uses a future date range (2030-2034) to avoid conflicts with production data.
 * @returns Period string in YYYY-MM format (e.g., "2031-07")
 */
export function generateTestPeriod(): string {
  const year = 2030 + Math.floor(Math.random() * 5); // 2030-2034
  const month = Math.floor(Math.random() * 12) + 1; // 1-12
  return `${year}-${month.toString().padStart(2, '0')}`;
}

/**
 * Generate a date range for period filtering tests.
 * Start is always in first half of year (Jan-Jun), end is always in second half (Jul-Dec).
 * @returns Tuple of [startPeriod, endPeriod] where start <= end
 */
export function generateTestPeriodRange(): [string, string] {
  const startYear = 2030 + Math.floor(Math.random() * 3); // 2030-2032
  const startMonth = Math.floor(Math.random() * 6) + 1; // 1-6
  const endYear = startYear + Math.floor(Math.random() * 2); // same year or +1
  const endMonth = Math.floor(Math.random() * 6) + 7; // 7-12

  const start = `${startYear}-${startMonth.toString().padStart(2, '0')}`;
  const end = `${endYear}-${endMonth.toString().padStart(2, '0')}`;

  return [start, end];
}

/**
 * Generate a unique test code with prefix to avoid conflicts.
 * @param prefix - Prefix for the code (default: 'TEST')
 * @returns Code in format `{prefix}-{uniqueId}` (e.g., "SKU-1738782000000-abc123def")
 */
export function generateTestCode(prefix: string = 'TEST'): string {
  return `${prefix}-${generateUniqueId()}`;
}

/**
 * Get database instance from the app for direct database operations in tests.
 */
export function getDb(app: INestApplication): Kysely<DB> {
  return app.get(DatabaseService);
}

/**
 * Assert that an async operation throws an ApiError with the expected status code.
 * @param operation - Async function that should throw
 * @param expectedStatus - Expected HTTP status code
 * @param message - Optional custom message for the assertion
 */
export async function expectApiError(
  operation: () => Promise<unknown>,
  expectedStatus: number,
  message?: string,
): Promise<void> {
  try {
    await operation();
    expect.fail(message ?? `Expected ApiError with status ${expectedStatus}`);
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(expectedStatus);
  }
}

/**
 * Assert that an async operation throws a 401 Unauthorized error.
 */
export async function expectUnauthorized(operation: () => Promise<unknown>): Promise<void> {
  return expectApiError(operation, 401, 'Expected 401 Unauthorized');
}

/**
 * Assert that an async operation throws a 403 Forbidden error.
 */
export async function expectForbidden(operation: () => Promise<unknown>): Promise<void> {
  return expectApiError(operation, 403, 'Expected 403 Forbidden');
}

/**
 * Assert that an async operation throws a 404 Not Found error.
 */
export async function expectNotFound(operation: () => Promise<unknown>): Promise<void> {
  return expectApiError(operation, 404, 'Expected 404 Not Found');
}

/**
 * Assert that an async operation throws a 409 Conflict error.
 */
export async function expectConflict(operation: () => Promise<unknown>): Promise<void> {
  return expectApiError(operation, 409, 'Expected 409 Conflict');
}

/**
 * Delete a user and all related data.
 * Cascades through: sales_history, skus, marketplaces, brands, categories, groups,
 * statuses, suppliers, shops, user_roles, user_shops, api_keys, tenants, and the user.
 */
export async function cleanupUser(app: INestApplication, userId: number): Promise<void> {
  const db = getDb(app);

  // Find all tenants owned or created by this user
  const tenants = await db
    .selectFrom('tenants')
    .select('id')
    .where((eb) => eb.or([eb('owner_id', '=', userId), eb('created_by', '=', userId)]))
    .execute();

  // Delete all tenants and their data
  for (const tenant of tenants) {
    // Get all shops for this tenant
    const shops = await db
      .selectFrom('shops')
      .select('id')
      .where('tenant_id', '=', tenant.id)
      .execute();

    // Delete all shop-scoped data
    for (const shop of shops) {
      await db.deleteFrom('sales_history').where('shop_id', '=', shop.id).execute();
      await db.deleteFrom('skus').where('shop_id', '=', shop.id).execute();
      await db.deleteFrom('marketplaces').where('shop_id', '=', shop.id).execute();
      await db.deleteFrom('brands').where('shop_id', '=', shop.id).execute();
      await db.deleteFrom('categories').where('shop_id', '=', shop.id).execute();
      await db.deleteFrom('groups').where('shop_id', '=', shop.id).execute();
      await db.deleteFrom('statuses').where('shop_id', '=', shop.id).execute();
      await db.deleteFrom('suppliers').where('shop_id', '=', shop.id).execute();
      await db.deleteFrom('user_shops').where('shop_id', '=', shop.id).execute();
    }

    // Delete shops after their dependent data
    for (const shop of shops) {
      await db.deleteFrom('shops').where('id', '=', shop.id).execute();
    }

    // Delete tenant-scoped data
    await db.deleteFrom('user_roles').where('tenant_id', '=', tenant.id).execute();
    await db.deleteFrom('tenants').where('id', '=', tenant.id).execute();
  }

  // Delete user's remaining data and the user
  await db.deleteFrom('api_keys').where('user_id', '=', userId).execute();
  await db.deleteFrom('user_roles').where('user_id', '=', userId).execute();
  await db.deleteFrom('user_shops').where('user_id', '=', userId).execute();
  await db.deleteFrom('users').where('id', '=', userId).execute();
}
