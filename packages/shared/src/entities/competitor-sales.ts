export interface CompetitorSale {
  id: number;
  tenantId: number;
  shopId: number;
  competitorProductId: number;
  period: string; // YYYY-MM format
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}
