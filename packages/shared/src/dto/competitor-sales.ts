// Competitor sales
export interface CreateCompetitorSaleRequest {
  competitor_product_id: number;
  period: string; // YYYY-MM format
  quantity: number;
}

export interface CreateCompetitorSaleDto {
  tenant_id: number;
  shop_id: number;
  competitor_product_id: number;
  period: string;
  quantity: number;
}

export interface UpdateCompetitorSaleDto {
  quantity?: number;
}

export type UpdateCompetitorSaleRequest = UpdateCompetitorSaleDto;

export interface ImportCompetitorSaleItem {
  marketplace: string; // marketplace code
  marketplaceProductId: string; // BIGINT as string
  period: string; // YYYY-MM format
  quantity: number;
}

export interface CompetitorSaleQuery {
  period_from?: string;
  period_to?: string;
  limit?: number;
  offset?: number;
}
