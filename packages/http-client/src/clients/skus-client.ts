import type {
  Sku,
  CreateSkuRequest,
  UpdateSkuRequest,
  ImportSkuItem,
  SkuExportItem,
  SkuImportResult,
  ShopContextParams,
  PaginationQuery,
  PaginatedResponse,
} from '@sales-planner/shared';
import { ImportExportBaseClient } from './import-export-base-client.js';

export class SkusClient extends ImportExportBaseClient {
  async getSkus(ctx: ShopContextParams, query?: PaginationQuery): Promise<PaginatedResponse<Sku>> {
    return this.request('GET', '/skus', { params: { ...ctx, ...query } });
  }

  async getSku(ctx: ShopContextParams, id: number): Promise<Sku> {
    return this.request('GET', `/skus/${id}`, { params: ctx });
  }

  async getSkuByCode(ctx: ShopContextParams, code: string): Promise<Sku> {
    return this.request('GET', `/skus/code/${encodeURIComponent(code)}`, { params: ctx });
  }

  async createSku(ctx: ShopContextParams, request: CreateSkuRequest): Promise<Sku> {
    return this.request('POST', '/skus', { body: request, params: ctx });
  }

  async updateSku(ctx: ShopContextParams, id: number, request: UpdateSkuRequest): Promise<Sku> {
    return this.request('PUT', `/skus/${id}`, { body: request, params: ctx });
  }

  async deleteSku(ctx: ShopContextParams, id: number): Promise<void> {
    return this.request('DELETE', `/skus/${id}`, { params: ctx });
  }

  async importJson(ctx: ShopContextParams, items: ImportSkuItem[]): Promise<SkuImportResult> {
    return this.request('POST', '/skus/import/json', { body: items, params: ctx });
  }

  async importCsv(ctx: ShopContextParams, csvContent: string): Promise<SkuImportResult> {
    return this.uploadCsv('/skus/import/csv', csvContent, ctx);
  }

  async exportJson(ctx: ShopContextParams): Promise<SkuExportItem[]> {
    return this.request('GET', '/skus/export/json', { params: ctx });
  }

  async exportCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', '/skus/export/csv', { params: ctx });
  }

  async getExampleJson(): Promise<ImportSkuItem[]> {
    return this.requestPublic('GET', '/skus/examples/json');
  }

  async getExampleCsv(): Promise<string> {
    return this.requestTextPublic('GET', '/skus/examples/csv');
  }
}
