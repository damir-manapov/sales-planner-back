import type { PaginatedResponse, PaginationQuery, SkuMetrics } from '@sales-planner/shared';
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
    shopId: number,
    tenantId: number,
    query?: PaginationQuery,
  ): Promise<PaginatedResponse<SkuMetrics>> {
    return this.request('GET', '/sku-metrics', {
      params: {
        shop_id: shopId,
        tenant_id: tenantId,
        ...query,
      },
    });
  }

  /**
   * Get a single SKU metric by ID
   */
  async get(id: number, shopId: number, tenantId: number): Promise<SkuMetrics> {
    return this.request('GET', `/sku-metrics/${id}`, {
      params: {
        shop_id: shopId,
        tenant_id: tenantId,
      },
    });
  }

  /**
   * Get SKU metrics filtered by ABC classification
   */
  async getByAbcClass(
    abcClass: 'A' | 'B' | 'C',
    shopId: number,
    tenantId: number,
  ): Promise<SkuMetrics[]> {
    return this.request('GET', `/sku-metrics/abc/${abcClass}`, {
      params: {
        shop_id: shopId,
        tenant_id: tenantId,
      },
    });
  }

  /**
   * Export SKU metrics as CSV
   */
  async exportCsv(shopId: number, tenantId: number): Promise<string> {
    return this.requestText('GET', '/sku-metrics/export/csv', {
      params: {
        shop_id: shopId,
        tenant_id: tenantId,
      },
    });
  }

  /**
   * Export SKU metrics as JSON
   */
  async exportJson(shopId: number, tenantId: number): Promise<SkuMetrics[]> {
    return this.request('GET', '/sku-metrics/export/json', {
      params: {
        shop_id: shopId,
        tenant_id: tenantId,
      },
    });
  }
}
