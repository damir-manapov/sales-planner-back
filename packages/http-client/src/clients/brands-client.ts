import type {
  Brand,
  CreateBrandRequest,
  UpdateBrandRequest,
  ImportBrandItem,
  BrandExportItem,
  ImportResult,
  ShopContextParams,
} from '@sales-planner/shared';
import { ImportExportBaseClient } from './import-export-base-client.js';

export class BrandsClient extends ImportExportBaseClient {
  async getBrands(ctx: ShopContextParams): Promise<Brand[]> {
    return this.request('GET', '/brands', { params: ctx });
  }

  async getBrand(ctx: ShopContextParams, id: number): Promise<Brand> {
    return this.request('GET', `/brands/${id}`, { params: ctx });
  }

  async getBrandByCode(ctx: ShopContextParams, code: string): Promise<Brand> {
    return this.request('GET', `/brands/code/${encodeURIComponent(code)}`, { params: ctx });
  }

  async createBrand(ctx: ShopContextParams, request: CreateBrandRequest): Promise<Brand> {
    return this.request('POST', '/brands', { body: request, params: ctx });
  }

  async updateBrand(
    ctx: ShopContextParams,
    id: number,
    request: UpdateBrandRequest,
  ): Promise<Brand> {
    return this.request('PUT', `/brands/${id}`, { body: request, params: ctx });
  }

  async deleteBrand(ctx: ShopContextParams, id: number): Promise<void> {
    return this.request('DELETE', `/brands/${id}`, { params: ctx });
  }

  async importJson(ctx: ShopContextParams, items: ImportBrandItem[]): Promise<ImportResult> {
    return this.request('POST', '/brands/import/json', { body: items, params: ctx });
  }

  async importCsv(ctx: ShopContextParams, csvContent: string): Promise<ImportResult> {
    return this.uploadCsv('/brands/import/csv', csvContent, ctx);
  }

  async exportJson(ctx: ShopContextParams): Promise<BrandExportItem[]> {
    return this.request('GET', '/brands/export/json', { params: ctx });
  }

  async exportCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', '/brands/export/csv', { params: ctx });
  }

  async getExampleJson(): Promise<ImportBrandItem[]> {
    return this.requestPublic('GET', '/brands/examples/json');
  }

  async getExampleCsv(): Promise<string> {
    return this.requestTextPublic('GET', '/brands/examples/csv');
  }
}
