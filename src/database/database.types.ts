import { Generated, ColumnType } from 'kysely';

// Base types for common columns
// ColumnType<SelectType, InsertType, UpdateType>
// Using Date | undefined for insert means it's optional (DB default handles it)
export type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>;

export interface UsersTable {
  id: Generated<number>;
  email: string;
  name: string;
  default_shop_id: number | null;
  created_at: ColumnType<Date, never, never>;
  updated_at: Timestamp;
}

export interface ApiKeysTable {
  id: Generated<number>;
  user_id: number;
  key: string;
  name: string | null;
  expires_at: Date | null;
  last_used_at: Date | null;
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
  tenant_id: number | null;
  created_at: ColumnType<Date, never, never>;
}

export interface TenantsTable {
  id: Generated<number>;
  title: string;
  owner_id: number | null;
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

export interface MarketplacesTable {
  id: string;
  title: string;
  created_at: ColumnType<Date, never, never>;
  updated_at: Timestamp;
}

export interface Database {
  users: UsersTable;
  api_keys: ApiKeysTable;
  roles: RolesTable;
  user_roles: UserRolesTable;
  tenants: TenantsTable;
  shops: ShopsTable;
  user_shops: UserShopsTable;
  marketplaces: MarketplacesTable;
}
