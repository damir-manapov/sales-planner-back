import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ImportCategoryItem,
  CategoryExportItem,
  ImportResult,
  ShopContextParams,
} from '@sales-planner/shared';
import { ImportExportBaseClient } from './import-export-base-client.js';

export class CategoriesClient extends ImportExportBaseClient {
  async getCategories(ctx: ShopContextParams): Promise<Category[]> {
    return this.request('GET', '/categories', { params: ctx });
  }

  async getCategory(ctx: ShopContextParams, id: number): Promise<Category> {
    return this.request('GET', `/categories/${id}`, { params: ctx });
  }

  async getCategoryByCode(ctx: ShopContextParams, code: string): Promise<Category> {
    return this.request('GET', `/categories/code/${encodeURIComponent(code)}`, { params: ctx });
  }

  async createCategory(ctx: ShopContextParams, request: CreateCategoryRequest): Promise<Category> {
    return this.request('POST', '/categories', { body: request, params: ctx });
  }

  async updateCategory(
    ctx: ShopContextParams,
    id: number,
    request: UpdateCategoryRequest,
  ): Promise<Category> {
    return this.request('PUT', `/categories/${id}`, { body: request, params: ctx });
  }

  async deleteCategory(ctx: ShopContextParams, id: number): Promise<void> {
    return this.request('DELETE', `/categories/${id}`, { params: ctx });
  }

  // Import/Export methods
  async importJson(ctx: ShopContextParams, items: ImportCategoryItem[]): Promise<ImportResult> {
    return this.request('POST', '/categories/import/json', { body: items, params: ctx });
  }

  async importCsv(ctx: ShopContextParams, csvContent: string): Promise<ImportResult> {
    return this.uploadCsv('/categories/import/csv', csvContent, ctx);
  }

  async exportJson(ctx: ShopContextParams): Promise<CategoryExportItem[]> {
    return this.request('GET', '/categories/export/json', { params: ctx });
  }

  async exportCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', '/categories/export/csv', { params: ctx });
  }

  async getExampleJson(): Promise<CategoryExportItem[]> {
    return this.requestPublic('GET', '/categories/examples/json');
  }

  async getExampleCsv(): Promise<string> {
    return this.requestTextPublic('GET', '/categories/examples/csv');
  }
}
