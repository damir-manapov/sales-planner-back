import { Injectable } from '@nestjs/common';
import type { SkuMetrics } from '@sales-planner/shared';
import { ReadOnlyShopScopedRepository } from '../../common/index.js';
import { DatabaseService, USER_QUERYABLE_TABLES } from '../../database/index.js';

@Injectable()
export class SkuMetricsRepository extends ReadOnlyShopScopedRepository<SkuMetrics> {
  constructor(db: DatabaseService) {
    super(db, 'mv_sku_metrics', USER_QUERYABLE_TABLES);
  }

  /**
   * Find SKU metrics with optional ABC class filter
   */
  async findByAbcClass(shopId: number, abcClass: 'A' | 'B' | 'C'): Promise<SkuMetrics[]> {
    return this.db
      .selectFrom('mv_sku_metrics')
      .selectAll()
      .where('shop_id', '=', shopId)
      .where('abc_class', '=', abcClass)
      .orderBy('sales_rank', 'asc')
      .execute() as Promise<SkuMetrics[]>;
  }
}
