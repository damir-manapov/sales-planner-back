// Competitor products
export interface CreateCompetitorProductRequest {
  marketplaceId: number;
  marketplaceProductId: string; // BIGINT as string
  title?: string;
  brand?: string;
}

export interface CreateCompetitorProductDto {
  tenantId: number;
  shopId: number;
  marketplaceId: number;
  marketplaceProductId: string; // BIGINT as string
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
  ids?: number[];
  limit?: number;
  offset?: number;
}
