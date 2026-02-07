// SKU competitor mappings
export interface CreateSkuCompetitorMappingRequest {
  sku_id: number;
  competitor_product_id: number;
}

export interface CreateSkuCompetitorMappingDto {
  tenant_id: number;
  shop_id: number;
  sku_id: number;
  competitor_product_id: number;
}

export interface UpdateSkuCompetitorMappingDto {
  competitor_product_id?: number;
}

export type UpdateSkuCompetitorMappingRequest = UpdateSkuCompetitorMappingDto;

export interface ImportSkuCompetitorMappingItem {
  sku: string; // sku code
  marketplace: string; // marketplace code
  marketplaceProductId: string; // BIGINT as string
}
