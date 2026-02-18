import type { ShopContextParams } from '@sales-planner/shared';

/**
 * Common shop context required by most hooks
 */
export interface ShopContext {
  shopId: number;
  tenantId: number;
}

export function toShopContextParams(ctx: ShopContext): ShopContextParams {
  return { shop_id: ctx.shopId, tenant_id: ctx.tenantId };
}

/**
 * Standard query key factory for cache management
 */
export const queryKeys = {
  me: () => ['sales-planner', 'me'] as const,
  metadata: () => ['sales-planner', 'metadata'] as const,

  entity: (entity: string, ctx: ShopContext) =>
    ['sales-planner', entity, ctx.shopId, ctx.tenantId] as const,

  entityList: (entity: string, ctx: ShopContext, query?: Record<string, unknown>) =>
    [...queryKeys.entity(entity, ctx), 'list', query ?? {}] as const,

  entityDetail: (entity: string, ctx: ShopContext, id: number) =>
    [...queryKeys.entity(entity, ctx), id] as const,

  entityByCode: (entity: string, ctx: ShopContext, code: string) =>
    [...queryKeys.entity(entity, ctx), 'code', code] as const,

  entityExport: (entity: string, ctx: ShopContext, format: 'json' | 'csv') =>
    [...queryKeys.entity(entity, ctx), 'export', format] as const,

  skuMetrics: (ctx: ShopContext) =>
    ['sales-planner', 'sku-metrics', ctx.shopId, ctx.tenantId] as const,
  skuMetricsList: (ctx: ShopContext, query?: Record<string, unknown>) =>
    [...queryKeys.skuMetrics(ctx), 'list', query ?? {}] as const,
  skuMetricsDetail: (ctx: ShopContext, id: number) => [...queryKeys.skuMetrics(ctx), id] as const,
  skuMetricsAbc: (ctx: ShopContext, abcClass: string) =>
    [...queryKeys.skuMetrics(ctx), 'abc', abcClass] as const,

  computed: (ctx: ShopContext) => ['sales-planner', 'computed', ctx.shopId, ctx.tenantId] as const,
} as const;
