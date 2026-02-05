export interface CreateSkuRequest {
  code: string;
  title: string;
  title2?: string;
  category_id?: number;
  group_id?: number;
  status_id?: number;
  supplier_id?: number;
}
export interface CreateSkuDto {
  code: string;
  title: string;
  title2?: string | null;
  shop_id: number;
  tenant_id: number;
  category_id?: number | null;
  group_id?: number | null;
  status_id?: number | null;
  supplier_id?: number | null;
}

export interface UpdateSkuDto {
  code?: string;
  title?: string;
  title2?: string | null;
  category_id?: number | null;
  group_id?: number | null;
  status_id?: number | null;
  supplier_id?: number | null;
}
export type UpdateSkuRequest = UpdateSkuDto;

export interface ImportSkuItem {
  code: string;
  title: string;
  title2?: string;
  category?: string;
  group?: string;
  status?: string;
  supplier?: string;
}
