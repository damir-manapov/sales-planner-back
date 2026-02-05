import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiKeysModule } from './api-keys/index.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/index.js';
import { BootstrapModule } from './bootstrap/index.js';
import { BrandsModule } from './brands/index.js';
import { CategoriesModule } from './categories/index.js';
import { databaseConfig } from './database/database.config.js';
import { DatabaseModule } from './database/index.js';
import { GroupsModule } from './groups/index.js';
import { MarketplacesModule } from './marketplaces/index.js';
import { MeModule } from './me/index.js';
import { MetadataModule } from './metadata/index.js';
import { StatusesModule } from './statuses/index.js';
import { RolesModule } from './roles/index.js';
import { SalesHistoryModule } from './sales-history/index.js';
import { ShopsModule } from './shops/index.js';
import { SkusModule } from './skus/index.js';
import { TenantsModule } from './tenants/index.js';
import { UserRolesModule } from './user-roles/index.js';
import { UserShopsModule } from './user-shops/index.js';
import { UsersModule } from './users/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [databaseConfig],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    MeModule,
    RolesModule,
    UserRolesModule,
    TenantsModule,
    ShopsModule,
    UserShopsModule,
    ApiKeysModule,
    BootstrapModule,
    MarketplacesModule,
    MetadataModule,
    SkusModule,
    BrandsModule,
    CategoriesModule,
    GroupsModule,
    StatusesModule,
    SalesHistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
