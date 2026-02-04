/**
 * Data Transfer Objects for create/update operations
 */

export interface CreateUserDto {
  email: string;
  name: string;
  default_shop_id?: number;
}

export interface CreateTenantDto {
  title: string;
  owner_id?: number;
  created_by?: number;
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

export interface CreateMarketplaceDto {
  id: string;
  title: string;
}
