export interface CreateUserDto {
  email: string;
  name: string;
  defaultShopId?: number;
}
export type CreateUserRequest = CreateUserDto;

export interface UpdateUserDto {
  email?: string;
  name?: string;
  defaultShopId?: number | null;
}
export type UpdateUserRequest = UpdateUserDto;
