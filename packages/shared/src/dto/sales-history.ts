export interface CreateSalesHistoryRequest {
  sku_id: number;
  period: string; // YYYY-MM format
  quantity: number;
  marketplace_id: number;
}
export interface CreateSalesHistoryDto {
  sku_id: number;
  shop_id: number;
  tenant_id: number;
  period: string; // YYYY-MM format
  quantity: number;
  marketplace_id: number;
}

export interface UpdateSalesHistoryDto {
  quantity?: number;
}
export type UpdateSalesHistoryRequest = UpdateSalesHistoryDto;

export interface ImportSalesHistoryItem {
  sku_code: string;
  period: string; // YYYY-MM format
  quantity: number;
  marketplace: string;
}
