export interface CreateSkuRequest {
  code: string;
  title: string;
  category_code?: string;
  group_code?: string;
  status_code?: string;
}
export interface CreateSkuDto {
  code: string;
  title: string;
  shop_id: number;
  tenant_id: number;
  category_code?: string;
  group_code?: string;
  status_code?: string;
}

export interface UpdateSkuDto {
  code?: string;
  title?: string;
  category_code?: string;
  group_code?: string;
  status_code?: string;
}
export type UpdateSkuRequest = UpdateSkuDto;

export interface ImportSkuItem {
  code: string;
  title: string;
  category_code?: string;
  group_code?: string;
  status_code?: string;
}
