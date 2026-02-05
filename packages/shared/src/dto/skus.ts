export interface CreateSkuRequest {
  code: string;
  title: string;
  category?: string;
  group?: string;
  status?: string;
  supplier?: string;
}
export interface CreateSkuDto {
  code: string;
  title: string;
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
  category_id?: number | null;
  group_id?: number | null;
  status_id?: number | null;
  supplier_id?: number | null;
}
export interface UpdateSkuRequest {
  code?: string;
  title?: string;
  category?: string;
  group?: string;
  status?: string;
  supplier?: string;
}

export interface ImportSkuItem {
  code: string;
  title: string;
  category?: string;
  group?: string;
  status?: string;
  supplier?: string;
}
