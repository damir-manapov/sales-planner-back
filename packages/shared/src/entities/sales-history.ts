export interface SalesHistory {
  id: number;
  skuId: number;
  shopId: number;
  tenantId: number;
  period: string; // YYYY-MM format
  quantity: number;
  marketplaceId: number;
  createdAt: Date;
  updatedAt: Date;
}
