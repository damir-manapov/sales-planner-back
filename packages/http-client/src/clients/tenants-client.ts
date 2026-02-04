import type {
  Tenant,
  CreateTenantDto,
  CreateTenantWithShopDto,
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

  async createTenant(dto: CreateTenantDto): Promise<Tenant> {
    return this.request('POST', '/tenants', { body: dto });
  }

  async createTenantWithShopAndUser(
    dto: CreateTenantWithShopDto,
  ): Promise<TenantWithShopAndApiKey> {
    return this.request('POST', '/tenants/with-shop-and-user', { body: dto });
  }

  async updateTenant(id: number, dto: Partial<CreateTenantDto>): Promise<Tenant> {
    return this.request('PUT', `/tenants/${id}`, { body: dto });
  }

  async deleteTenant(id: number): Promise<void> {
    return this.request('DELETE', `/tenants/${id}`);
  }
}
