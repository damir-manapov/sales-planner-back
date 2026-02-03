import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => {
  const url = process.env.DATABASE_URL;

  // Parse DATABASE_URL if provided, otherwise use defaults
  // Format: postgresql://user:password@host:port/database?sslmode=require
  if (url) {
    const parsed = new URL(url);
    return {
      url,
      host: parsed.hostname,
      port: parseInt(parsed.port || '5432', 10),
      database: parsed.pathname.slice(1), // Remove leading /
      user: parsed.username,
      password: parsed.password,
      ssl: parsed.searchParams.get('sslmode') === 'require',
      serverless: process.env.SERVERLESS === 'true',
    };
  }

  return {
    url: undefined,
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    database: process.env.DATABASE_NAME ?? 'sales_planner',
    user: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    ssl: process.env.DATABASE_SSL === 'true',
    serverless: process.env.SERVERLESS === 'true',
  };
});
