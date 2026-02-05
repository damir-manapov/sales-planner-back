import type {
  Brand,
  CreateBrandRequest,
  UpdateBrandDto,
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

  async getBrand(id: number, ctx: ShopContextParams): Promise<Brand> {
    return this.request('GET', `/brands/${id}`, { params: ctx });
  }

  async getBrandByCode(code: string, ctx: ShopContextParams): Promise<Brand> {
    return this.request('GET', `/brands/code/${encodeURIComponent(code)}`, { params: ctx });
  }

  async createBrand(dto: CreateBrandRequest, ctx: ShopContextParams): Promise<Brand> {
    return this.request('POST', '/brands', { body: dto, params: ctx });
  }

  async updateBrand(id: number, dto: UpdateBrandDto, ctx: ShopContextParams): Promise<Brand> {
    return this.request('PUT', `/brands/${id}`, { body: dto, params: ctx });
  }

  async deleteBrand(id: number, ctx: ShopContextParams): Promise<void> {
    return this.request('DELETE', `/brands/${id}`, { params: ctx });
  }

  async importJson(items: ImportBrandItem[], ctx: ShopContextParams): Promise<ImportResult> {
    return this.request('POST', '/brands/import/json', { body: items, params: ctx });
  }

  async importCsv(csvContent: string, ctx: ShopContextParams): Promise<ImportResult> {
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
