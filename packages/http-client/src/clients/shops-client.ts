import type {
  Shop,
  CreateShopRequest,
  UpdateShopRequest,
  DeleteDataResult,
} from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class ShopsClient extends BaseClient {
  async getShops(tenantId?: number): Promise<Shop[]> {
    return this.request('GET', '/shops', { params: { tenantId } });
  }

  async getShop(id: number): Promise<Shop> {
    return this.request('GET', `/shops/${id}`);
  }

  async createShop(request: CreateShopRequest): Promise<Shop> {
    return this.request('POST', '/shops', { body: request });
  }

  async updateShop(id: number, request: UpdateShopRequest): Promise<Shop> {
    return this.request('PUT', `/shops/${id}`, { body: request });
  }

  async deleteShop(id: number): Promise<void> {
    return this.request('DELETE', `/shops/${id}`);
  }

  async deleteShopData(id: number): Promise<DeleteDataResult> {
    return this.request('DELETE', `/shops/${id}/data`);
  }
}
