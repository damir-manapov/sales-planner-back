import type {
  Marketplace,
  CreateMarketplaceRequest,
  ImportMarketplaceItem,
  MarketplaceExportItem,
  ImportResult,
  ShopContextParams,
} from '@sales-planner/shared';
import { ImportExportBaseClient } from './import-export-base-client.js';

export class MarketplacesClient extends ImportExportBaseClient {
  async getMarketplaces(ctx: ShopContextParams): Promise<Marketplace[]> {
    return this.request('GET', '/marketplaces', { params: ctx });
  }

  async getMarketplace(id: string, ctx: ShopContextParams): Promise<Marketplace> {
    return this.request('GET', `/marketplaces/${id}`, { params: ctx });
  }

  async createMarketplace(
    dto: CreateMarketplaceRequest,
    ctx: ShopContextParams,
  ): Promise<Marketplace> {
    return this.request('POST', '/marketplaces', { body: dto, params: ctx });
  }

  async updateMarketplace(
    id: string,
    dto: Partial<CreateMarketplaceRequest>,
    ctx: ShopContextParams,
  ): Promise<Marketplace> {
    return this.request('PUT', `/marketplaces/${id}`, { body: dto, params: ctx });
  }

  async deleteMarketplace(id: string, ctx: ShopContextParams): Promise<void> {
    return this.request('DELETE', `/marketplaces/${id}`, { params: ctx });
  }

  async importMarketplacesJson(
    items: ImportMarketplaceItem[],
    ctx: ShopContextParams,
  ): Promise<ImportResult> {
    return this.request('POST', '/marketplaces/import/json', { body: items, params: ctx });
  }

  async importMarketplacesCsv(csvContent: string, ctx: ShopContextParams): Promise<ImportResult> {
    return this.uploadCsv('/marketplaces/import/csv', csvContent, ctx);
  }

  async exportMarketplacesJson(ctx: ShopContextParams): Promise<MarketplaceExportItem[]> {
    return this.request('GET', '/marketplaces/export/json', { params: ctx });
  }

  async exportMarketplacesCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', '/marketplaces/export/csv', { params: ctx });
  }

  async getMarketplaceExamplesJson(): Promise<ImportMarketplaceItem[]> {
    return this.requestPublic('GET', '/marketplaces/examples/json');
  }

  async getMarketplaceExamplesCsv(): Promise<string> {
    return this.requestTextPublic('GET', '/marketplaces/examples/csv');
  }
}
