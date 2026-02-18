import type { UserShop, CreateUserShopRequest, GetUserShopsQuery } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class UserShopsClient extends BaseClient {
  async getAll(query?: GetUserShopsQuery): Promise<UserShop[]> {
    const params: Record<string, string | number | undefined> = {};
    if (query?.userId) params.userId = query.userId;
    if (query?.shopId) params.shopId = query.shopId;
    if (query?.tenantId) params.tenantId = query.tenantId;
    return this.request('GET', '/user-shops', { params });
  }

  async getById(id: number): Promise<UserShop> {
    return this.request('GET', `/user-shops/${id}`);
  }

  async create(request: CreateUserShopRequest): Promise<UserShop> {
    return this.request('POST', '/user-shops', { body: request });
  }

  async delete(id: number): Promise<void> {
    return this.request('DELETE', `/user-shops/${id}`);
  }
}
