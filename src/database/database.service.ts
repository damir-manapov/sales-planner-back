import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { Database } from './database.types.js';

@Injectable()
export class DatabaseService extends Kysely<Database> implements OnModuleDestroy {
  constructor(configService: ConfigService) {
    // Use ConfigService with fallback to process.env for serverless
    const connectionString =
      configService.get<string>('database.connectionString') || process.env.DATABASE_URL;
    const host =
      configService.get<string>('database.host') || process.env.DATABASE_HOST || 'localhost';
    const port =
      configService.get<number>('database.port') || Number(process.env.DATABASE_PORT) || 5432;
    const database =
      configService.get<string>('database.database') || process.env.DATABASE_NAME || 'sales_planner';
    const user =
      configService.get<string>('database.user') || process.env.DATABASE_USER || 'postgres';
    const password =
      configService.get<string>('database.password') || process.env.DATABASE_PASSWORD || 'postgres';

    // Enable SSL for Neon or any cloud provider requiring SSL
    const isNeonHost = host?.includes('neon.tech') || false;

    const poolConfig: pg.PoolConfig = connectionString
      ? {
          connectionString,
          ssl: { rejectUnauthorized: false }, // Required for Neon
          max: 10,
        }
      : {
          host,
          port,
          database,
          user,
          password,
          ssl: isNeonHost ? { rejectUnauthorized: false } : undefined,
          max: 10,
        };

    super({
      dialect: new PostgresDialect({
        pool: new pg.Pool(poolConfig),
      }),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.destroy();
  }
}
