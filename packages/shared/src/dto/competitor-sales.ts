// Competitor sales
export interface CreateCompetitorSaleRequest {
  competitorProductId: number;
  period: string; // YYYY-MM format
  quantity: number;
}

export interface CreateCompetitorSaleDto {
  tenantId: number;
  shopId: number;
  competitorProductId: number;
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
  ids?: number[];
  periodFrom?: string;
  periodTo?: string;
  limit?: number;
  offset?: number;
}
