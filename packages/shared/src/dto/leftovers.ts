// Leftovers (inventory)
export interface CreateLeftoverRequest {
  warehouseId: number;
  skuId: number;
  period: string; // YYYY-MM format
  quantity: number;
}

export interface CreateLeftoverDto {
  tenantId: number;
  shopId: number;
  warehouseId: number;
  skuId: number;
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
  periodFrom?: string;
  periodTo?: string;
  limit?: number;
  offset?: number;
}
