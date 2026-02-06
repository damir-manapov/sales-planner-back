import type {
  Tenant,
  CreateTenantRequest,
  UpdateTenantRequest,
  CreateTenantWithShopRequest,
  TenantWithShopAndApiKey,
  PaginatedResponse,
  PaginationQuery,
} from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export interface GetTenantsQuery extends PaginationQuery {
  owner_id?: number;
}

export class TenantsClient extends BaseClient {
  async getAll(query?: GetTenantsQuery): Promise<PaginatedResponse<Tenant>> {
    return this.request('GET', '/tenants', { params: query as Record<string, string | number | undefined> });
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
