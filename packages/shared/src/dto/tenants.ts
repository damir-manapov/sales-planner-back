export interface CreateTenantDto {
  title: string;
  owner_id?: number;
  created_by?: number;
}
export interface CreateTenantRequest {
  title: string;
  owner_id?: number;
}

export interface UpdateTenantDto {
  title?: string;
  owner_id?: number | null;
}
export type UpdateTenantRequest = UpdateTenantDto;

export interface CreateTenantWithShopDto {
  tenantTitle: string;
  shopTitle?: string;
  userEmail: string;
  userName: string;
}
export type CreateTenantWithShopRequest = CreateTenantWithShopDto;
