export interface CreateMarketplaceRequest {
  id: string;
  title: string;
}
export interface CreateMarketplaceDto {
  id: string;
  title: string;
  shop_id: number;
  tenant_id: number;
}

export interface UpdateMarketplaceDto {
  title?: string;
}
export type UpdateMarketplaceRequest = UpdateMarketplaceDto;

export interface ImportMarketplaceItem {
  id: string;
  title: string;
}
