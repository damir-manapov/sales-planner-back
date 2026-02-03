import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { DB } from './database.types.js';

@Injectable()
export class DatabaseService extends Kysely<DB> implements OnModuleDestroy {
  constructor(configService: ConfigService) {
    const url = configService.get<string>('database.url');
    const host = configService.get<string>('database.host');
    const port = configService.get<number>('database.port');
    const database = configService.get<string>('database.database');
    const user = configService.get<string>('database.user');
    const password = configService.get<string>('database.password');
    const ssl = configService.get<boolean>('database.ssl');
    const serverless = configService.get<boolean>('database.serverless');

    const poolConfig: pg.PoolConfig = url
      ? {
          connectionString: url,
          ssl: ssl ? { rejectUnauthorized: false } : undefined,
          max: serverless ? 1 : 10,
          connectionTimeoutMillis: 5000,
        }
      : {
          host,
          port,
          database,
          user,
          password,
          ssl: ssl ? { rejectUnauthorized: false } : undefined,
          max: serverless ? 1 : 10,
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
