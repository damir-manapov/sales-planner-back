import { Injectable } from '@nestjs/common';
import type { PaginatedResponse, PaginationQuery, SkuMetrics } from '@sales-planner/shared';
import { SkuMetricsRepository } from './sku-metrics.repository.js';

export type { SkuMetrics };

@Injectable()
export class SkuMetricsService {
  constructor(private readonly repository: SkuMetricsRepository) {}

  async findByShopIdPaginated(
    shopId: number,
    query: PaginationQuery = {},
  ): Promise<PaginatedResponse<SkuMetrics>> {
    return this.repository.findByShopIdPaginated(shopId, query);
  }

  async findByShopId(shopId: number, query?: PaginationQuery): Promise<SkuMetrics[]> {
    return this.repository.findByShopId(shopId, query);
  }

  async findById(id: number): Promise<SkuMetrics | undefined> {
    return this.repository.findById(id);
  }

  async findByAbcClass(shopId: number, abcClass: 'A' | 'B' | 'C'): Promise<SkuMetrics[]> {
    return this.repository.findByAbcClass(shopId, abcClass);
  }
}
