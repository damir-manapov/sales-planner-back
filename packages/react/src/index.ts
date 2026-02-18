// Provider
export { SalesPlannerProvider, useSalesPlannerClient } from './provider.js';
export type { SalesPlannerProviderProps, ClientConfig } from './provider.js';

// Query keys for custom cache management
export { queryKeys, toShopContextParams } from './keys.js';
export type { ShopContext } from './keys.js';

// Hook factories (for advanced use)
export { createCodedEntityHooks } from './create-coded-entity-hooks.js';
export { createShopScopedHooks } from './create-shop-scoped-hooks.js';

// ── Coded entity hooks ──
export { brands } from './coded-entities.js';
export { categories } from './coded-entities.js';
export { groups } from './coded-entities.js';
export { statuses } from './coded-entities.js';
export { suppliers } from './coded-entities.js';
export { warehouses } from './coded-entities.js';
export { marketplaces } from './coded-entities.js';

// ── Shop-scoped entity hooks ──
export { skus } from './shop-scoped-entities.js';
export { salesHistory } from './shop-scoped-entities.js';
export { leftovers } from './shop-scoped-entities.js';
export { seasonalCoefficients } from './shop-scoped-entities.js';
export { skuCompetitorMappings } from './shop-scoped-entities.js';
export { competitorProducts } from './shop-scoped-entities.js';
export { competitorSales } from './shop-scoped-entities.js';

// ── Specialized hooks ──
export {
  useMe,
  useEntitiesMetadata,
  useSkuMetrics,
  useSkuMetricsById,
  useSkuMetricsByAbcClass,
  useSkuMetricsExportCsv,
  useComputedViews,
  useRefreshAllViews,
} from './specialized.js';
