import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/index.js';
import { databaseConfig } from './database/database.config.js';
import { UsersModule } from './users/index.js';
import { RolesModule } from './roles/index.js';
import { UserRolesModule } from './user-roles/index.js';
import { TenantsModule } from './tenants/index.js';
import { ShopsModule } from './shops/index.js';
import { UserShopsModule } from './user-shops/index.js';
import { ApiKeysModule } from './api-keys/index.js';
import { BootstrapModule } from './bootstrap/index.js';
import { MarketplacesModule } from './marketplaces/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [databaseConfig],
    }),
    DatabaseModule,
    UsersModule,
    RolesModule,
    UserRolesModule,
    TenantsModule,
    ShopsModule,
    UserShopsModule,
    ApiKeysModule,
    BootstrapModule,
    MarketplacesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
