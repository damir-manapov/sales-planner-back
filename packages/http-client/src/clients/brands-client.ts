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

  async createBrand(dto: CreateBrandRequest, ctx: ShopContextParams): Promise<Brand> {
    return this.request('POST', '/brands', { body: dto, params: ctx });
  }

  async updateBrand(id: number, dto: UpdateBrandDto, ctx: ShopContextParams): Promise<Brand> {
    return this.request('PUT', `/brands/${id}`, { body: dto, params: ctx });
  }

  async deleteBrand(id: number, ctx: ShopContextParams): Promise<void> {
    return this.request('DELETE', `/brands/${id}`, { params: ctx });
  }

  async importBrandsJson(items: ImportBrandItem[], ctx: ShopContextParams): Promise<ImportResult> {
    return this.request('POST', '/brands/import/json', { body: items, params: ctx });
  }

  async importBrandsCsv(csvContent: string, ctx: ShopContextParams): Promise<ImportResult> {
    return this.uploadCsv('/brands/import/csv', csvContent, ctx);
  }

  async exportBrandsJson(ctx: ShopContextParams): Promise<BrandExportItem[]> {
    return this.request('GET', '/brands/export/json', { params: ctx });
  }

  async exportBrandsCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', '/brands/export/csv', { params: ctx });
  }

  async getBrandsExampleJson(): Promise<ImportBrandItem[]> {
    return this.requestPublic('GET', '/brands/examples/json');
  }

  async getBrandsExampleCsv(): Promise<string> {
    return this.requestTextPublic('GET', '/brands/examples/csv');
  }
}
