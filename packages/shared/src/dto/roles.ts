export interface CreateRoleDto {
  name: string;
  description?: string;
}
export type CreateRoleRequest = CreateRoleDto;

export interface UpdateRoleDto {
  name?: string;
  description?: string | null;
}
export type UpdateRoleRequest = UpdateRoleDto;
