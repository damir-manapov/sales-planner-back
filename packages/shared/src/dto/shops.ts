export interface CreateShopDto {
  title: string;
  tenantId: number;
}
export type CreateShopRequest = CreateShopDto;

export interface UpdateShopDto {
  title?: string;
}
export type UpdateShopRequest = UpdateShopDto;
