import type {
  Shop,
  CreateShopRequest,
  UpdateShopRequest,
  DeleteDataResult,
  PaginatedResponse,
  PaginationQuery,
} from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export interface GetShopsQuery extends PaginationQuery {
  tenantId?: number;
}

export class ShopsClient extends BaseClient {
  async getAll(query?: GetShopsQuery): Promise<PaginatedResponse<Shop>> {
    return this.request('GET', '/shops', { params: query as Record<string, string | number | undefined> });
  }

  async getById(id: number): Promise<Shop> {
    return this.request('GET', `/shops/${id}`);
  }

  async create(request: CreateShopRequest): Promise<Shop> {
    return this.request('POST', '/shops', { body: request });
  }

  async update(id: number, request: UpdateShopRequest): Promise<Shop> {
    return this.request('PUT', `/shops/${id}`, { body: request });
  }

  async delete(id: number): Promise<void> {
    return this.request('DELETE', `/shops/${id}`);
  }

  async deleteData(id: number): Promise<DeleteDataResult> {
    return this.request('DELETE', `/shops/${id}/data`);
  }
}
