import type {
  Shop,
  CreateShopRequest,
  UpdateShopRequest,
  DeleteDataResult,
} from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class ShopsClient extends BaseClient {
  async getAll(tenantId?: number): Promise<Shop[]> {
    return this.request('GET', '/shops', { params: { tenantId } });
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
