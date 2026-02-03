/**
 * Shared types for Sales Planner API
 * These types are used by both the API and UI
 */

// ============================================================
// Core Entities
// ============================================================

export interface User {
  id: number;
  email: string;
  name: string;
  default_shop_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Tenant {
  id: number;
  title: string;
  owner_id: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface Shop {
  id: number;
  title: string;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface Sku {
  id: number;
  code: string;
  title: string;
  shop_id: number;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface SalesHistory {
  id: number;
  sku_id: number;
  shop_id: number;
  tenant_id: number;
  period: Date;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKey {
  id: number;
  user_id: number;
  key: string;
  name: string | null;
  expires_at: Date | null;
  last_used_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Marketplace {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================
// DTOs - Create/Update
// ============================================================

export interface CreateUserDto {
  email: string;
  name: string;
  default_shop_id?: number;
}

export interface CreateTenantDto {
  title: string;
  owner_id?: number;
}

export interface CreateTenantWithShopDto {
  tenantTitle: string;
  shopTitle?: string;
  userEmail: string;
  userName: string;
}

export interface CreateShopDto {
  title: string;
  tenant_id: number;
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

export interface ImportSkuItem {
  code: string;
  title: string;
}

export interface CreateSalesHistoryDto {
  sku_id: number;
  shop_id: number;
  tenant_id: number;
  period: string; // YYYY-MM format
  quantity: number;
}

export interface UpdateSalesHistoryDto {
  quantity?: number;
}

export interface ImportSalesHistoryItem {
  sku_code: string;
  period: string; // YYYY-MM format
  quantity: number;
}

export interface CreateApiKeyDto {
  user_id: number;
  key?: string;
  name?: string;
  expires_at?: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
}

export interface CreateUserRoleDto {
  user_id: number;
  role_id: number;
  tenant_id?: number;
  shop_id?: number;
}

// ============================================================
// Response Types
// ============================================================

export interface UserRole {
  id: number;
  role_name: string;
  tenant_id: number | null;
  tenant_title: string | null;
  shop_id: number | null;
  shop_title: string | null;
}

export interface ShopInfo {
  id: number;
  title: string;
}

export interface TenantInfo {
  id: number;
  title: string;
  is_owner: boolean;
  shops: ShopInfo[];
}

export interface UserWithRolesAndTenants extends User {
  roles: UserRole[];
  tenants: TenantInfo[];
}

export interface TenantWithShopAndApiKey {
  tenant: Tenant;
  shop: {
    id: number;
    title: string;
    tenant_id: number;
  };
  user: {
    id: number;
    email: string;
    name: string;
  };
  apiKey: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  skus_created?: number;
  errors: string[];
}

export interface DeleteDataResult {
  skusDeleted: number;
  salesHistoryDeleted: number;
}

// ============================================================
// Query Parameters
// ============================================================

export interface ShopContextParams {
  shop_id: number;
  tenant_id: number;
  [key: string]: string | number | undefined;
}

export interface PeriodQuery {
  period_from?: string; // YYYY-MM format
  period_to?: string; // YYYY-MM format
}

export interface SalesHistoryExportItem {
  sku_code: string;
  period: string;
  quantity: number;
}

export interface SkuExportItem {
  code: string;
  title: string;
}
