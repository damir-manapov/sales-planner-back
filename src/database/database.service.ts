import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { Database } from './database.types.js';

@Injectable()
export class DatabaseService extends Kysely<Database> implements OnModuleDestroy {
  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('database.connectionString');
    const host = configService.get<string>('database.host') || 'localhost';
    const port = configService.get<number>('database.port') || 5432;
    const database = configService.get<string>('database.database') || 'sales_planner';
    const user = configService.get<string>('database.user') || 'postgres';
    const password = configService.get<string>('database.password') || 'postgres';

    // Enable SSL for Neon or any cloud provider requiring SSL
    const isNeonHost = host?.includes('neon.tech') || false;

    const poolConfig: pg.PoolConfig = connectionString
      ? {
          connectionString,
          ssl: { rejectUnauthorized: false },
          max: 1, // Serverless-friendly
          connectionTimeoutMillis: 5000,
        }
      : {
          host,
          port,
          database,
          user,
          password,
          ssl: isNeonHost ? { rejectUnauthorized: false } : undefined,
          max: 10,
          connectionTimeoutMillis: 5000,
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
