import type { ShopContextParams } from '@sales-planner/shared';
import { ImportExportBaseClient } from './import-export-base-client.js';
import type { ClientConfig } from './base-client.js';

/**
 * Generic client for shop-scoped resources with import/export capabilities.
 */
export class ShopScopedClient<
  TEntity,
  TCreateRequest,
  TUpdateRequest,
  TImportItem,
  TExportItem,
  TImportResult,
> extends ImportExportBaseClient {
  constructor(
    config: ClientConfig,
    protected readonly resourcePath: string,
  ) {
    super(config);
  }

  async getAll(ctx: ShopContextParams, query?: Record<string, string | number | undefined>): Promise<TEntity[]> {
    return this.request('GET', `/${this.resourcePath}`, { params: { ...ctx, ...query } });
  }

  async getById(ctx: ShopContextParams, id: number): Promise<TEntity> {
    return this.request('GET', `/${this.resourcePath}/${id}`, { params: ctx });
  }

  async create(ctx: ShopContextParams, request: TCreateRequest): Promise<TEntity> {
    return this.request('POST', `/${this.resourcePath}`, { body: request, params: ctx });
  }

  async update(ctx: ShopContextParams, id: number, request: TUpdateRequest): Promise<TEntity> {
    return this.request('PUT', `/${this.resourcePath}/${id}`, { body: request, params: ctx });
  }

  async delete(ctx: ShopContextParams, id: number): Promise<void> {
    return this.request('DELETE', `/${this.resourcePath}/${id}`, { params: ctx });
  }

  async importJson(ctx: ShopContextParams, items: TImportItem[]): Promise<TImportResult> {
    return this.request('POST', `/${this.resourcePath}/import/json`, { body: items, params: ctx });
  }

  async importCsv(ctx: ShopContextParams, csvContent: string): Promise<TImportResult> {
    return this.uploadCsv(`/${this.resourcePath}/import/csv`, csvContent, ctx);
  }

  async exportJson(ctx: ShopContextParams, query?: Record<string, string | number | undefined>): Promise<TExportItem[]> {
    return this.request('GET', `/${this.resourcePath}/export/json`, { params: { ...ctx, ...query } });
  }

  async exportCsv(ctx: ShopContextParams, query?: Record<string, string | number | undefined>): Promise<string> {
    return this.requestText('GET', `/${this.resourcePath}/export/csv`, { params: { ...ctx, ...query } });
  }

  async getExampleJson(): Promise<TImportItem[]> {
    return this.requestPublic('GET', `/${this.resourcePath}/examples/json`);
  }

  async getExampleCsv(): Promise<string> {
    return this.requestTextPublic('GET', `/${this.resourcePath}/examples/csv`);
  }
}
