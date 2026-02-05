// Brands
export interface CreateBrandRequest {
  code: string;
  title: string;
}

export interface CreateBrandDto {
  code: string;
  title: string;
  shop_id: number;
  tenant_id: number;
}

export interface UpdateBrandDto {
  code?: string;
  title?: string;
}

export type UpdateBrandRequest = UpdateBrandDto;
