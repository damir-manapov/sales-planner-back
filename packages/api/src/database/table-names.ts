import { InvalidTableNameException } from '../common/exceptions.js';
import type { DB } from './database.types.js';

/** All valid table names from the database schema */
export type TableName = keyof DB;

/**
 * Whitelist of valid table names for runtime validation.
 * Must be kept in sync with DB interface (enforced by TableName type).
 */
export const VALID_TABLE_NAMES: readonly TableName[] = [
  'api_keys',
  'brands',
  'categories',
  'competitor_sales',
  'groups',
  'leftovers',
  'marketplaces',
  'mv_sku_metrics',
  'roles',
  'sales_history',
  'seasonal_coefficients',
  'shops',
  'sku_competitor_mappings',
  'skus',
  'statuses',
  'suppliers',
  'tenants',
  'user_roles',
  'user_shops',
  'users',
  'warehouses',
] as const;

/**
 * Tables that can be queried by users via dynamic query API.
 * Excludes sensitive tables like api_keys, users, roles, etc.
 */
export const USER_QUERYABLE_TABLES: readonly TableName[] = [
  'brands',
  'categories',
  'competitor_sales',
  'groups',
  'leftovers',
  'marketplaces',
  'mv_sku_metrics',
  'sales_history',
  'seasonal_coefficients',
  'sku_competitor_mappings',
  'skus',
  'statuses',
  'suppliers',
  'warehouses',
] as const;

/**
 * Validates that a string is in the allowed table names list.
 * Throws InvalidTableNameException if invalid to prevent SQL injection.
 */
export function assertValidTableName(
  name: string,
  allowedTables: readonly string[] = VALID_TABLE_NAMES,
): asserts name is TableName {
  if (!allowedTables.includes(name)) {
    throw new InvalidTableNameException(name);
  }
}
