/**
 * API response types
 */

import type { Tenant, User } from './entities.js';

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
  marketplaces_created?: number;
  errors: string[];
}

export interface DeleteDataResult {
  skusDeleted: number;
  salesHistoryDeleted: number;
}

export interface SalesHistoryExportItem {
  sku_code: string;
  period: string;
  quantity: number;
  marketplace: string;
}

export interface SkuExportItem {
  code: string;
  title: string;
}
