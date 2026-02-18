export interface CreateUserRoleDto {
  userId: number;
  roleId: number;
  tenantId?: number;
  shopId?: number;
}
export type CreateUserRoleRequest = CreateUserRoleDto;
