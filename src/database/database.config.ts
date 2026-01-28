import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  // Neon or any Postgres connection string
  // Format: postgres://user:password@host:port/database?sslmode=require
  connectionString: process.env.DATABASE_URL,
  // Fallback to individual params for local dev
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  database: process.env.DATABASE_NAME ?? 'sales_planner',
  user: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
}));
