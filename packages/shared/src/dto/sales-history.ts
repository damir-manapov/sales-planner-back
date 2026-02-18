export interface CreateSalesHistoryRequest {
  skuId: number;
  period: string; // YYYY-MM format
  quantity: number;
  marketplaceId: number;
}
export interface CreateSalesHistoryDto {
  skuId: number;
  shopId: number;
  tenantId: number;
  period: string; // YYYY-MM format
  quantity: number;
  marketplaceId: number;
}

export interface UpdateSalesHistoryDto {
  quantity?: number;
}
export type UpdateSalesHistoryRequest = UpdateSalesHistoryDto;

export interface ImportSalesHistoryItem {
  marketplace: string;
  period: string; // YYYY-MM format
  sku: string;
  quantity: number;
}
