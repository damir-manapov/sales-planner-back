import type {
  Tenant,
  CreateTenantRequest,
  UpdateTenantRequest,
  CreateTenantWithShopRequest,
  TenantWithShopAndApiKey,
} from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class TenantsClient extends BaseClient {
  async getAll(): Promise<Tenant[]> {
    return this.request('GET', '/tenants');
  }

  async getById(id: number): Promise<Tenant> {
    return this.request('GET', `/tenants/${id}`);
  }

  async create(request: CreateTenantRequest): Promise<Tenant> {
    return this.request('POST', '/tenants', { body: request });
  }

  async createWithShopAndUser(
    request: CreateTenantWithShopRequest,
  ): Promise<TenantWithShopAndApiKey> {
    return this.request('POST', '/tenants/with-shop-and-user', { body: request });
  }

  async update(id: number, request: UpdateTenantRequest): Promise<Tenant> {
    return this.request('PUT', `/tenants/${id}`, { body: request });
  }

  async delete(id: number): Promise<void> {
    return this.request('DELETE', `/tenants/${id}`);
  }
}
