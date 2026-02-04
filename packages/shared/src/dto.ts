/**
 * Data Transfer Objects for create/update operations
 * 
 * Pattern:
 * - CreateXDto: Full DTO with context fields (shop_id, tenant_id, etc.)
 * - CreateXRequest: HTTP request type (may omit context fields if injected)
 * - UpdateXDto: Update fields
 * - UpdateXRequest: HTTP update request (typically same as DTO)
 */

// Users
export interface CreateUserDto {
  email: string;
  name: string;
  default_shop_id?: number;
}
export type CreateUserRequest = CreateUserDto;

export interface UpdateUserDto {
  email?: string;
  name?: string;
  default_shop_id?: number | null;
}
export type UpdateUserRequest = UpdateUserDto;

// Tenants
export interface CreateTenantDto {
  title: string;
  owner_id?: number;
  created_by?: number;
}
export interface CreateTenantRequest {
  title: string;
  owner_id?: number;
}

export interface UpdateTenantDto {
  title?: string;
  owner_id?: number | null;
}
export type UpdateTenantRequest = UpdateTenantDto;

export interface CreateTenantWithShopDto {
  tenantTitle: string;
  shopTitle?: string;
  userEmail: string;
  userName: string;
}

// Shops
export interface CreateShopDto {
  title: string;
  tenant_id: number;
}
export type CreateShopRequest = CreateShopDto;

export interface UpdateShopDto {
  title?: string;
}
export type UpdateShopRequest = UpdateShopDto;

// SKUs
export interface CreateSkuRequest {
  code: string;
  title: string;
}
export interface CreateSkuDto {
  code: string;
  title: string;
  shop_id: number;
  tenant_id: number;
}

export interface UpdateSkuDto {
  code?: string;
  title?: string;
}
export type UpdateSkuRequest = UpdateSkuDto;

// Sales History
export interface CreateSalesHistoryRequest {
  sku_id: number;
  period: string; // YYYY-MM format
  quantity: number;
  marketplace_id: string;
}
export interface CreateSalesHistoryDto {
  sku_id: number;
  shop_id: number;
  tenant_id: number;
  period: string; // YYYY-MM format
  quantity: number;
  marketplace_id: string;
}

export interface UpdateSalesHistoryDto {
  quantity?: number;
}
export type UpdateSalesHistoryRequest = UpdateSalesHistoryDto;

// Marketplaces
export interface CreateMarketplaceRequest {
  id: string;
  title: string;
}
export interface CreateMarketplaceDto {
  id: string;
  title: string;
  shop_id: number;
  tenant_id: number;
}

export interface UpdateMarketplaceDto {
  title?: string;
}
export type UpdateMarketplaceRequest = UpdateMarketplaceDto;

// API Keys
export interface CreateApiKeyDto {
  user_id: number;
  name?: string;
  expires_at?: string;
}
export type CreateApiKeyRequest = CreateApiKeyDto;

export interface UpdateApiKeyDto {
  name?: string | null;
  expires_at?: string | null;
}
export type UpdateApiKeyRequest = UpdateApiKeyDto;

// Roles
export interface CreateRoleDto {
  name: string;
  description?: string;
}
export type CreateRoleRequest = CreateRoleDto;

export interface UpdateRoleDto {
  name?: string;
  description?: string | null;
}
export type UpdateRoleRequest = UpdateRoleDto;

// User Roles
export interface CreateUserRoleDto {
  user_id: number;
  role_id: number;
  tenant_id?: number;
  shop_id?: number;
}
export type CreateUserRoleRequest = CreateUserRoleDto;

// Import types for bulk operations
export interface ImportSkuItem {
  code: string;
  title: string;
}

export interface ImportSalesHistoryItem {
  sku_code: string;
  period: string; // YYYY-MM format
  quantity: number;
  marketplace: string;
}

export interface ImportMarketplaceItem {
  id: string;
  title: string;
}
