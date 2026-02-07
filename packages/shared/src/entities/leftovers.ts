export interface Leftover {
  id: number;
  tenant_id: number;
  shop_id: number;
  warehouse_id: number;
  sku_id: number;
  period: string; // YYYY-MM format
  quantity: number;
  created_at: Date;
  updated_at: Date;
}
