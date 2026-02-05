import type {
  Sku,
  CreateSkuRequest,
  UpdateSkuDto,
  ImportSkuItem,
  SkuExportItem,
  SkuImportResult,
  ShopContextParams,
} from '@sales-planner/shared';
import { ImportExportBaseClient } from './import-export-base-client.js';

export class SkusClient extends ImportExportBaseClient {
  async getSkus(ctx: ShopContextParams): Promise<Sku[]> {
    return this.request('GET', '/skus', { params: ctx });
  }

  async getSku(id: number, ctx: ShopContextParams): Promise<Sku> {
    return this.request('GET', `/skus/${id}`, { params: ctx });
  }

  async createSku(dto: CreateSkuRequest, ctx: ShopContextParams): Promise<Sku> {
    return this.request('POST', '/skus', { body: dto, params: ctx });
  }

  async updateSku(id: number, dto: UpdateSkuDto, ctx: ShopContextParams): Promise<Sku> {
    return this.request('PUT', `/skus/${id}`, { body: dto, params: ctx });
  }

  async deleteSku(id: number, ctx: ShopContextParams): Promise<void> {
    return this.request('DELETE', `/skus/${id}`, { params: ctx });
  }

  async importSkusJson(items: ImportSkuItem[], ctx: ShopContextParams): Promise<SkuImportResult> {
    return this.request('POST', '/skus/import/json', { body: items, params: ctx });
  }

  async importSkusCsv(csvContent: string, ctx: ShopContextParams): Promise<SkuImportResult> {
    return this.uploadCsv('/skus/import/csv', csvContent, ctx);
  }

  async exportSkusJson(ctx: ShopContextParams): Promise<SkuExportItem[]> {
    return this.request('GET', '/skus/export/json', { params: ctx });
  }

  async exportSkusCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', '/skus/export/csv', { params: ctx });
  }

  async getSkusExampleJson(): Promise<ImportSkuItem[]> {
    return this.requestPublic('GET', '/skus/examples/json');
  }

  async getSkusExampleCsv(): Promise<string> {
    return this.requestTextPublic('GET', '/skus/examples/csv');
  }
}
