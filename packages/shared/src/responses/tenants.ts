import type { Tenant } from '../entities/tenants';

export interface TenantWithShopAndApiKey {
  tenant: Tenant;
  shop: {
    id: number;
    title: string;
    tenantId: number;
  };
  user: {
    id: number;
    email: string;
    name: string;
  };
  apiKey: string;
}
