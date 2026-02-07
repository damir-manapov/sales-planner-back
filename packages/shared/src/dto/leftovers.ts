// Leftovers (inventory)
export interface CreateLeftoverRequest {
  warehouse_id: number;
  sku_id: number;
  period: string; // YYYY-MM format
  quantity: number;
}

export interface CreateLeftoverDto {
  tenant_id: number;
  shop_id: number;
  warehouse_id: number;
  sku_id: number;
  period: string;
  quantity: number;
}

export interface UpdateLeftoverDto {
  quantity?: number;
}

export type UpdateLeftoverRequest = UpdateLeftoverDto;

export interface ImportLeftoverItem {
  warehouse: string; // warehouse code
  sku: string; // sku code
  period: string; // YYYY-MM format
  quantity: number;
}

export interface LeftoverQuery {
  ids?: number[];
  period_from?: string;
  period_to?: string;
  limit?: number;
  offset?: number;
}
