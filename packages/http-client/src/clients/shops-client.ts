import type { Shop, CreateShopDto, DeleteDataResult } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class ShopsClient extends BaseClient {
  async getShops(tenantId?: number): Promise<Shop[]> {
    return this.request('GET', '/shops', { params: { tenantId } });
  }

  async getShop(id: number): Promise<Shop> {
    return this.request('GET', `/shops/${id}`);
  }

  async createShop(dto: CreateShopDto): Promise<Shop> {
    return this.request('POST', '/shops', { body: dto });
  }

  async updateShop(id: number, dto: Partial<CreateShopDto>): Promise<Shop> {
    return this.request('PUT', `/shops/${id}`, { body: dto });
  }

  async deleteShop(id: number): Promise<void> {
    return this.request('DELETE', `/shops/${id}`);
  }

  async deleteShopData(id: number): Promise<DeleteDataResult> {
    return this.request('DELETE', `/shops/${id}/data`);
  }
}
