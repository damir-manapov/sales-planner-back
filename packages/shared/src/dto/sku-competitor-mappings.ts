// SKU competitor mappings
export interface CreateSkuCompetitorMappingRequest {
  skuId: number;
  competitorProductId: number;
}

export interface CreateSkuCompetitorMappingDto {
  tenantId: number;
  shopId: number;
  skuId: number;
  competitorProductId: number;
}

export interface UpdateSkuCompetitorMappingDto {
  competitorProductId?: number;
}

export type UpdateSkuCompetitorMappingRequest = UpdateSkuCompetitorMappingDto;

export interface ImportSkuCompetitorMappingItem {
  sku: string; // sku code
  marketplace: string; // marketplace code
  marketplaceProductId: string; // BIGINT as string
}
