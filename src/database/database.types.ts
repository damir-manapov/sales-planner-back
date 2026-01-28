import { Generated, ColumnType } from 'kysely';

// Base types for common columns
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

// Example table - replace with your actual schema
export interface UsersTable {
  id: Generated<number>;
  email: string;
  name: string;
  created_at: ColumnType<Date, never, never>;
  updated_at: Timestamp;
}

// Add your tables here
export interface Database {
  users: UsersTable;
}
