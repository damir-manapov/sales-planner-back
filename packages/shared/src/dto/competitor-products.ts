// Competitor products
export interface CreateCompetitorProductRequest {
  marketplace_id: number;
  marketplace_product_id: string; // BIGINT as string
  title?: string;
  brand?: string;
}

export interface CreateCompetitorProductDto {
  tenant_id: number;
  shop_id: number;
  marketplace_id: number;
  marketplace_product_id: string; // BIGINT as string
  title?: string;
  brand?: string;
}

export interface UpdateCompetitorProductDto {
  title?: string;
  brand?: string;
}

export type UpdateCompetitorProductRequest = UpdateCompetitorProductDto;

export interface ImportCompetitorProductItem {
  marketplace: string; // marketplace code
  marketplaceProductId: string; // BIGINT as string
  title?: string;
  brand?: string;
}

export interface CompetitorProductQuery {
  limit?: number;
  offset?: number;
}
