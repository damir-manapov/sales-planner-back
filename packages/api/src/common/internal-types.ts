/**
 * Internal types for repository/service layer
 * These are NOT part of the public API contract
 */

/** Result of bulk upsert operation */
export interface BulkUpsertResult {
  created: number;
  updated: number;
}
