export interface CreateTenantDto {
  title: string;
  ownerId?: number;
  createdBy?: number;
}
export interface CreateTenantRequest {
  title: string;
  ownerId: number;
}

export interface UpdateTenantDto {
  title?: string;
  ownerId?: number | null;
}
export type UpdateTenantRequest = UpdateTenantDto;

export interface CreateTenantWithShopDto {
  tenantTitle: string;
  shopTitle?: string;
  userEmail: string;
  userName?: string;
}
export type CreateTenantWithShopRequest = CreateTenantWithShopDto;
