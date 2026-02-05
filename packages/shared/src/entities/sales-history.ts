export interface SalesHistory {
  id: number;
  sku_id: number;
  shop_id: number;
  tenant_id: number;
  period: string; // YYYY-MM format
  quantity: number;
  marketplace_id: number;
  created_at: Date;
  updated_at: Date;
}
