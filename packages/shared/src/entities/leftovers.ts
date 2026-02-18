export interface Leftover {
  id: number;
  tenantId: number;
  shopId: number;
  warehouseId: number;
  skuId: number;
  period: string; // YYYY-MM format
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}
