import type {
  Marketplace,
  CreateMarketplaceRequest,
  UpdateMarketplaceRequest,
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

  async getMarketplace(ctx: ShopContextParams, id: number): Promise<Marketplace> {
    return this.request('GET', `/marketplaces/${id}`, { params: ctx });
  }

  async getMarketplaceByCode(ctx: ShopContextParams, code: string): Promise<Marketplace> {
    return this.request('GET', `/marketplaces/code/${encodeURIComponent(code)}`, { params: ctx });
  }

  async createMarketplace(
    ctx: ShopContextParams,
    request: CreateMarketplaceRequest,
  ): Promise<Marketplace> {
    return this.request('POST', '/marketplaces', { body: request, params: ctx });
  }

  async updateMarketplace(
    ctx: ShopContextParams,
    id: number,
    request: UpdateMarketplaceRequest,
  ): Promise<Marketplace> {
    return this.request('PUT', `/marketplaces/${id}`, { body: request, params: ctx });
  }

  async deleteMarketplace(ctx: ShopContextParams, id: number): Promise<void> {
    return this.request('DELETE', `/marketplaces/${id}`, { params: ctx });
  }

  async importJson(ctx: ShopContextParams, items: ImportMarketplaceItem[]): Promise<ImportResult> {
    return this.request('POST', '/marketplaces/import/json', { body: items, params: ctx });
  }

  async importCsv(ctx: ShopContextParams, csvContent: string): Promise<ImportResult> {
    return this.uploadCsv('/marketplaces/import/csv', csvContent, ctx);
  }

  async exportJson(ctx: ShopContextParams): Promise<MarketplaceExportItem[]> {
    return this.request('GET', '/marketplaces/export/json', { params: ctx });
  }

  async exportCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', '/marketplaces/export/csv', { params: ctx });
  }

  async getExampleJson(): Promise<ImportMarketplaceItem[]> {
    return this.requestPublic('GET', '/marketplaces/examples/json');
  }

  async getExampleCsv(): Promise<string> {
    return this.requestTextPublic('GET', '/marketplaces/examples/csv');
  }
}
