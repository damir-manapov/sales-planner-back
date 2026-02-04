/**
 * Core database entities
 */

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
  period: string; // YYYY-MM format
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
