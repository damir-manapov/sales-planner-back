import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { Database } from './database.types.js';

@Injectable()
export class DatabaseService extends Kysely<Database> implements OnModuleDestroy {
  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('database.connectionString');
    const host = configService.get<string>('database.host');

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
          port: configService.get<number>('database.port'),
          database: configService.get<string>('database.database'),
          user: configService.get<string>('database.user'),
          password: configService.get<string>('database.password'),
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
