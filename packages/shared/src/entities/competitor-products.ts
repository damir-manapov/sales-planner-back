export interface CompetitorProduct {
  id: number;
  tenant_id: number;
  shop_id: number;
  marketplace_id: number;
  marketplace_product_id: string; // BIGINT returned as string from DB
  title: string | null;
  brand: string | null;
  created_at: Date;
  updated_at: Date;
}
