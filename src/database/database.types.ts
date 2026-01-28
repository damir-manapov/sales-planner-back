import { Generated, ColumnType } from 'kysely';

// Base types for common columns
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface UsersTable {
  id: Generated<number>;
  email: string;
  name: string;
  created_at: ColumnType<Date, never, never>;
  updated_at: Timestamp;
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
  tenants: TenantsTable;
  shops: ShopsTable;
  user_shops: UserShopsTable;
}
