// Suppliers
export interface CreateSupplierRequest {
  code: string;
  title: string;
}

export interface CreateSupplierDto {
  code: string;
  title: string;
  shop_id: number;
  tenant_id: number;
}

export interface UpdateSupplierDto {
  code?: string;
  title?: string;
}

export type UpdateSupplierRequest = UpdateSupplierDto;
