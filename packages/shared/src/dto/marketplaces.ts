export interface CreateMarketplaceRequest {
  code: string;
  title: string;
}
export interface CreateMarketplaceDto {
  code: string;
  title: string;
  shop_id: number;
  tenant_id: number;
}

export interface UpdateMarketplaceDto {
  title?: string;
}
export type UpdateMarketplaceRequest = UpdateMarketplaceDto;

export interface ImportMarketplaceItem {
  code: string;
  title: string;
}
