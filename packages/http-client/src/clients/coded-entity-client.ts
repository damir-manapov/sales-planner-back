import type { ImportResult, ShopContextParams } from '@sales-planner/shared';
import type { ClientConfig } from './base-client.js';
import { ImportExportBaseClient } from './import-export-base-client.js';

/**
 * Generic base client for coded shop-scoped entities.
 * Provides standard CRUD, import/export, and example operations.
 *
 * @typeParam TEntity - The entity type (e.g., Brand, Category)
 * @typeParam TCreateRequest - The create request type
 * @typeParam TUpdateRequest - The update request type
 * @typeParam TImportItem - The import item type
 * @typeParam TExportItem - The export item type
 */
export class CodedEntityClient<
  TEntity,
  TCreateRequest,
  TUpdateRequest,
  TImportItem,
  TExportItem,
> extends ImportExportBaseClient {
  constructor(
    config: ClientConfig,
    protected readonly entityPath: string,
  ) {
    super(config);
  }

  // CRUD operations

  async getAll(ctx: ShopContextParams): Promise<TEntity[]> {
    return this.request('GET', `/${this.entityPath}`, { params: ctx });
  }

  async getById(ctx: ShopContextParams, id: number): Promise<TEntity> {
    return this.request('GET', `/${this.entityPath}/${id}`, { params: ctx });
  }

  async getByCode(ctx: ShopContextParams, code: string): Promise<TEntity> {
    return this.request('GET', `/${this.entityPath}/code/${encodeURIComponent(code)}`, {
      params: ctx,
    });
  }

  async create(ctx: ShopContextParams, request: TCreateRequest): Promise<TEntity> {
    return this.request('POST', `/${this.entityPath}`, { body: request, params: ctx });
  }

  async update(ctx: ShopContextParams, id: number, request: TUpdateRequest): Promise<TEntity> {
    return this.request('PUT', `/${this.entityPath}/${id}`, { body: request, params: ctx });
  }

  async delete(ctx: ShopContextParams, id: number): Promise<void> {
    return this.request('DELETE', `/${this.entityPath}/${id}`, { params: ctx });
  }

  // Import operations

  async importJson(ctx: ShopContextParams, items: TImportItem[]): Promise<ImportResult> {
    return this.request('POST', `/${this.entityPath}/import/json`, { body: items, params: ctx });
  }

  async importCsv(ctx: ShopContextParams, csvContent: string): Promise<ImportResult> {
    return this.uploadCsv(`/${this.entityPath}/import/csv`, csvContent, ctx);
  }

  // Export operations

  async exportJson(ctx: ShopContextParams): Promise<TExportItem[]> {
    return this.request('GET', `/${this.entityPath}/export/json`, { params: ctx });
  }

  async exportCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', `/${this.entityPath}/export/csv`, { params: ctx });
  }

  // Example operations (public, no auth required)

  async getExampleJson(): Promise<TImportItem[]> {
    return this.requestPublic('GET', `/${this.entityPath}/examples/json`);
  }

  async getExampleCsv(): Promise<string> {
    return this.requestTextPublic('GET', `/${this.entityPath}/examples/csv`);
  }
}
