export interface CreateUserDto {
  email: string;
  name: string;
  default_shop_id?: number;
}
export type CreateUserRequest = CreateUserDto;

export interface UpdateUserDto {
  email?: string;
  name?: string;
  default_shop_id?: number | null;
}
export type UpdateUserRequest = UpdateUserDto;
