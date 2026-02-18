import type {
  PaginatedResponse,
  PaginationQuery,
  ShopContextParams,
  SkuMetrics,
} from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

/**
 * Client for read-only SKU metrics computed from materialized views.
 * SKU metrics include ABC classification, sales rank, and days of stock.
 */
export class SkuMetricsClient extends BaseClient {
  /**
   * List SKU metrics for a shop with pagination
   */
  async list(
    ctx: ShopContextParams,
    query?: PaginationQuery,
  ): Promise<PaginatedResponse<SkuMetrics>> {
    return this.request('GET', '/sku-metrics', {
      params: { ...ctx, ...query },
    });
  }

  /**
   * Get a single SKU metric by ID
   */
  async get(ctx: ShopContextParams, id: number): Promise<SkuMetrics> {
    return this.request('GET', `/sku-metrics/${id}`, {
      params: ctx,
    });
  }

  /**
   * Get SKU metrics filtered by ABC classification
   */
  async getByAbcClass(ctx: ShopContextParams, abcClass: 'A' | 'B' | 'C'): Promise<SkuMetrics[]> {
    return this.request('GET', `/sku-metrics/abc/${abcClass}`, {
      params: ctx,
    });
  }

  /**
   * Export SKU metrics as CSV
   */
  async exportCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', '/sku-metrics/export/csv', {
      params: ctx,
    });
  }

  /**
   * Export SKU metrics as JSON
   */
  async exportJson(ctx: ShopContextParams): Promise<SkuMetrics[]> {
    return this.request('GET', '/sku-metrics/export/json', {
      params: ctx,
    });
  }
}
