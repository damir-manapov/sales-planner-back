export interface CreateUserRoleDto {
  user_id: number;
  role_id: number;
  tenant_id?: number;
  shop_id?: number;
}
export type CreateUserRoleRequest = CreateUserRoleDto;
