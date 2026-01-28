import { Generated, ColumnType } from 'kysely';

// Base types for common columns
// ColumnType<SelectType, InsertType, UpdateType>
// Using Date | undefined for insert means it's optional (DB default handles it)
export type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>;

export interface UsersTable {
  id: Generated<number>;
  email: string;
  name: string;
  api_key: string | null;
  created_at: ColumnType<Date, never, never>;
  updated_at: Timestamp;
}

export interface RolesTable {
  id: Generated<number>;
  name: string;
  description: string | null;
  created_at: ColumnType<Date, never, never>;
  updated_at: Timestamp;
}

export interface UserRolesTable {
  id: Generated<number>;
  user_id: number;
  role_id: number;
  created_at: ColumnType<Date, never, never>;
}

export interface TenantsTable {
  id: Generated<number>;
  title: string;
  created_at: ColumnType<Date, never, never>;
  updated_at: Timestamp;
}

export interface ShopsTable {
  id: Generated<number>;
  tenant_id: number;
  title: string;
  created_at: ColumnType<Date, never, never>;
  updated_at: Timestamp;
}

export interface UserShopsTable {
  id: Generated<number>;
  user_id: number;
  shop_id: number;
  created_at: ColumnType<Date, never, never>;
}

export interface Database {
  users: UsersTable;
  roles: RolesTable;
  user_roles: UserRolesTable;
  tenants: TenantsTable;
  shops: ShopsTable;
  user_shops: UserShopsTable;
}
