export interface CompetitorSale {
  id: number;
  tenant_id: number;
  shop_id: number;
  competitor_product_id: number;
  period: string; // YYYY-MM format
  quantity: number;
  created_at: Date;
  updated_at: Date;
}
