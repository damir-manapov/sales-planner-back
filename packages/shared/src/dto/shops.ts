export interface CreateShopDto {
  title: string;
  tenant_id: number;
}
export type CreateShopRequest = CreateShopDto;

export interface UpdateShopDto {
  title?: string;
}
export type UpdateShopRequest = UpdateShopDto;
