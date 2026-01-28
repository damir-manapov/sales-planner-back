import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { Database } from './database.types.js';

@Injectable()
export class DatabaseService extends Kysely<Database> implements OnModuleDestroy {
  constructor(configService: ConfigService) {
    super({
      dialect: new PostgresDialect({
        pool: new pg.Pool({
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          database: configService.get<string>('database.database'),
          user: configService.get<string>('database.user'),
          password: configService.get<string>('database.password'),
          max: 10,
        }),
      }),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.destroy();
  }
}
