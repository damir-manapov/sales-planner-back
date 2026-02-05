import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryDto,
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

  async getCategory(id: number, ctx: ShopContextParams): Promise<Category> {
    return this.request('GET', `/categories/${id}`, { params: ctx });
  }

  async createCategory(dto: CreateCategoryRequest, ctx: ShopContextParams): Promise<Category> {
    return this.request('POST', '/categories', { body: dto, params: ctx });
  }

  async updateCategory(id: number, dto: UpdateCategoryDto, ctx: ShopContextParams): Promise<Category> {
    return this.request('PUT', `/categories/${id}`, { body: dto, params: ctx });
  }

  async deleteCategory(id: number, ctx: ShopContextParams): Promise<void> {
    return this.request('DELETE', `/categories/${id}`, { params: ctx });
  }

  // Import/Export methods
  async importCategoriesJson(
    items: ImportCategoryItem[],
    ctx: ShopContextParams,
  ): Promise<ImportResult> {
    return this.request('POST', '/categories/import/json', { body: items, params: ctx });
  }

  async importCategoriesCsv(csvContent: string, ctx: ShopContextParams): Promise<ImportResult> {
    return this.uploadCsv('/categories/import/csv', csvContent, ctx);
  }

  async exportCategoriesJson(ctx: ShopContextParams): Promise<CategoryExportItem[]> {
    return this.request('GET', '/categories/export/json', { params: ctx });
  }

  async exportCategoriesCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', '/categories/export/csv', { params: ctx });
  }

  async getExampleCategoriesJson(ctx: ShopContextParams): Promise<CategoryExportItem[]> {
    return this.requestPublic('GET', '/categories/examples/json');
  }

  async getExampleCategoriesCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestTextPublic('GET', '/categories/examples/csv');
  }
}
