import type {
  Tenant,
  CreateTenantRequest,
  UpdateTenantRequest,
  CreateTenantWithShopRequest,
  TenantWithShopAndApiKey,
} from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class TenantsClient extends BaseClient {
  async getTenants(): Promise<Tenant[]> {
    return this.request('GET', '/tenants');
  }

  async getTenant(id: number): Promise<Tenant> {
    return this.request('GET', `/tenants/${id}`);
  }

  async createTenant(request: CreateTenantRequest): Promise<Tenant> {
    return this.request('POST', '/tenants', { body: request });
  }

  async createTenantWithShopAndUser(
    request: CreateTenantWithShopRequest,
  ): Promise<TenantWithShopAndApiKey> {
    return this.request('POST', '/tenants/with-shop-and-user', { body: request });
  }

  async updateTenant(id: number, request: UpdateTenantRequest): Promise<Tenant> {
    return this.request('PUT', `/tenants/${id}`, { body: request });
  }

  async deleteTenant(id: number): Promise<void> {
    return this.request('DELETE', `/tenants/${id}`);
  }
}
