export interface CompetitorProduct {
  id: number;
  tenantId: number;
  shopId: number;
  marketplaceId: number;
  marketplaceProductId: string; // BIGINT returned as string from DB
  title: string | null;
  brand: string | null;
  createdAt: Date;
  updatedAt: Date;
}
