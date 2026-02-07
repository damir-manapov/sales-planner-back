/**
 * Data Transfer Objects for create/update operations
 *
 * Pattern:
 * - CreateXDto: Full DTO with context fields (shop_id, tenant_id, etc.)
 * - CreateXRequest: HTTP request type (may omit context fields if injected)
 * - UpdateXDto: Update fields
 * - UpdateXRequest: HTTP update request (typically same as DTO)
 */

export * from './base';
export * from './users';
export * from './tenants';
export * from './shops';
export * from './skus';
export * from './brands';
export * from './categories';
export * from './groups';
export * from './statuses';
export * from './suppliers';
export * from './warehouses';
export * from './sales-history';
export * from './marketplaces';
export * from './api-keys';
export * from './roles';
export * from './user-roles';
