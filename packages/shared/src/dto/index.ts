/**
 * Data Transfer Objects for create/update operations
 *
 * Pattern:
 * - CreateXDto: Full DTO with context fields (shop_id, tenant_id, etc.)
 * - CreateXRequest: HTTP request type (may omit context fields if injected)
 * - UpdateXDto: Update fields
 * - UpdateXRequest: HTTP update request (typically same as DTO)
 */

export * from './users.js';
export * from './tenants.js';
export * from './shops.js';
export * from './skus.js';
export * from './sales-history.js';
export * from './marketplaces.js';
export * from './api-keys.js';
export * from './roles.js';
export * from './user-roles.js';
