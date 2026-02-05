import type { Tenant } from '../entities/tenants.js';

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
