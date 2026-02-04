export interface CreateSkuRequest {
  code: string;
  title: string;
}
export interface CreateSkuDto {
  code: string;
  title: string;
  shop_id: number;
  tenant_id: number;
}

export interface UpdateSkuDto {
  code?: string;
  title?: string;
}
export type UpdateSkuRequest = UpdateSkuDto;

export interface ImportSkuItem {
  code: string;
  title: string;
}
