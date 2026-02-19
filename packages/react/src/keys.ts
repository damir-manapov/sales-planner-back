import type { ShopContextParams } from '@sales-planner/shared';

/**
 * Shop context required by most hooks.
 * Identical to ShopContextParams after the snake_case → camelCase migration.
 */
export type ShopContext = ShopContextParams;

/**
 * Standard query key factory for cache management
 */
export const queryKeys = {
  me: () => ['sales-planner', 'me'] as const,
  metadata: () => ['sales-planner', 'metadata'] as const,

  // ── Admin resources (no shop context) ──
  tenants: (query?: Record<string, unknown>) => ['sales-planner', 'tenants', query ?? {}] as const,
  tenantDetail: (id: number) => ['sales-planner', 'tenants', id] as const,

  users: (query?: Record<string, unknown>) => ['sales-planner', 'users', query ?? {}] as const,
  userDetail: (id: number) => ['sales-planner', 'users', id] as const,

  shops: (query?: Record<string, unknown>) => ['sales-planner', 'shops', query ?? {}] as const,
  shopDetail: (id: number) => ['sales-planner', 'shops', id] as const,

  roles: (query?: Record<string, unknown>) => ['sales-planner', 'roles', query ?? {}] as const,
  roleDetail: (id: number) => ['sales-planner', 'roles', id] as const,

  userRoles: (query?: Record<string, unknown>) =>
    ['sales-planner', 'user-roles', query ?? {}] as const,
  userRoleDetail: (id: number) => ['sales-planner', 'user-roles', id] as const,

  apiKeys: (query?: Record<string, unknown>) => ['sales-planner', 'api-keys', query ?? {}] as const,
  apiKeyDetail: (id: number) => ['sales-planner', 'api-keys', id] as const,

  // ── Data entities (shop-scoped) ──
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

  entityExample: (entity: string, format: 'json' | 'csv') =>
    ['sales-planner', entity, 'example', format] as const,

  skuMetrics: (ctx: ShopContext) =>
    ['sales-planner', 'sku-metrics', ctx.shopId, ctx.tenantId] as const,
  skuMetricsList: (ctx: ShopContext, query?: Record<string, unknown>) =>
    [...queryKeys.skuMetrics(ctx), 'list', query ?? {}] as const,
  skuMetricsDetail: (ctx: ShopContext, id: number) => [...queryKeys.skuMetrics(ctx), id] as const,
  skuMetricsAbc: (ctx: ShopContext, abcClass: string) =>
    [...queryKeys.skuMetrics(ctx), 'abc', abcClass] as const,

  computed: (ctx: ShopContext) => ['sales-planner', 'computed', ctx.shopId, ctx.tenantId] as const,
} as const;
