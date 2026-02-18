import type {
  Sku,
  CreateSkuRequest,
  UpdateSkuRequest,
  ImportSkuItem,
  SkuExportItem,
  PaginationQuery,
  SalesHistory,
  CreateSalesHistoryRequest,
  UpdateSalesHistoryRequest,
  ImportSalesHistoryItem,
  SalesHistoryExportItem,
  SalesHistoryImportResult,
  SalesHistoryQuery,
  Leftover,
  CreateLeftoverRequest,
  UpdateLeftoverRequest,
  ImportLeftoverItem,
  LeftoverExportItem,
  ImportResult,
  LeftoverQuery,
  SeasonalCoefficient,
  CreateSeasonalCoefficientRequest,
  UpdateSeasonalCoefficientRequest,
  ImportSeasonalCoefficientItem,
  SeasonalCoefficientExportItem,
  SkuCompetitorMapping,
  CreateSkuCompetitorMappingRequest,
  UpdateSkuCompetitorMappingRequest,
  ImportSkuCompetitorMappingItem,
  SkuCompetitorMappingExportItem,
  CompetitorProduct,
  CreateCompetitorProductRequest,
  UpdateCompetitorProductRequest,
  ImportCompetitorProductItem,
  CompetitorProductExportItem,
  CompetitorSale,
  CreateCompetitorSaleRequest,
  UpdateCompetitorSaleRequest,
  ImportCompetitorSaleItem,
  CompetitorSaleExportItem,
  CompetitorProductQuery,
  CompetitorSaleQuery,
} from '@sales-planner/shared';
import { createShopScopedHooks } from './create-shop-scoped-hooks.js';
import { createCodedEntityHooks } from './create-coded-entity-hooks.js';

// SKUs use a custom client, but the interface is the same as CodedEntityClient
export const skus = createCodedEntityHooks<
  Sku,
  CreateSkuRequest,
  UpdateSkuRequest,
  ImportSkuItem,
  SkuExportItem
>('skus', (c) => c.skus);

export const salesHistory = createShopScopedHooks<
  SalesHistory,
  CreateSalesHistoryRequest,
  UpdateSalesHistoryRequest,
  ImportSalesHistoryItem,
  SalesHistoryExportItem,
  SalesHistoryImportResult,
  SalesHistoryQuery
>('sales-history', (c) => c.salesHistory);

export const leftovers = createShopScopedHooks<
  Leftover,
  CreateLeftoverRequest,
  UpdateLeftoverRequest,
  ImportLeftoverItem,
  LeftoverExportItem,
  ImportResult,
  LeftoverQuery
>('leftovers', (c) => c.leftovers);

export const seasonalCoefficients = createShopScopedHooks<
  SeasonalCoefficient,
  CreateSeasonalCoefficientRequest,
  UpdateSeasonalCoefficientRequest,
  ImportSeasonalCoefficientItem,
  SeasonalCoefficientExportItem,
  ImportResult,
  PaginationQuery
>('seasonal-coefficients', (c) => c.seasonalCoefficients);

export const skuCompetitorMappings = createShopScopedHooks<
  SkuCompetitorMapping,
  CreateSkuCompetitorMappingRequest,
  UpdateSkuCompetitorMappingRequest,
  ImportSkuCompetitorMappingItem,
  SkuCompetitorMappingExportItem,
  ImportResult,
  PaginationQuery
>('sku-competitor-mappings', (c) => c.skuCompetitorMappings);

export const competitorProducts = createShopScopedHooks<
  CompetitorProduct,
  CreateCompetitorProductRequest,
  UpdateCompetitorProductRequest,
  ImportCompetitorProductItem,
  CompetitorProductExportItem,
  ImportResult,
  CompetitorProductQuery
>('competitor-products', (c) => c.competitorProducts);

export const competitorSales = createShopScopedHooks<
  CompetitorSale,
  CreateCompetitorSaleRequest,
  UpdateCompetitorSaleRequest,
  ImportCompetitorSaleItem,
  CompetitorSaleExportItem,
  ImportResult,
  CompetitorSaleQuery
>('competitor-sales', (c) => c.competitorSales);
