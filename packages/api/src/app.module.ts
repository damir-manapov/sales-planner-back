import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiKeysModule } from './entities/api-keys/index.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/index.js';
import { BootstrapModule } from './bootstrap/index.js';
import { BrandsModule } from './entities/brands/index.js';
import { CategoriesModule } from './entities/categories/index.js';
import { databaseConfig } from './database/database.config.js';
import { DatabaseModule } from './database/index.js';
import { GroupsModule } from './entities/groups/index.js';
import { MarketplacesModule } from './entities/marketplaces/index.js';
import { MeModule } from './me/index.js';
import { MetadataModule } from './metadata/index.js';
import { StatusesModule } from './entities/statuses/index.js';
import { SuppliersModule } from './entities/suppliers/index.js';
import { WarehousesModule } from './entities/warehouses/index.js';
import { RolesModule } from './roles/index.js';
import { SalesHistoryModule } from './entities/sales-history/index.js';
import { ShopsModule } from './entities/shops/index.js';
import { SkusModule } from './entities/skus/index.js';
import { TenantsModule } from './entities/tenants/index.js';
import { UserRolesModule } from './entities/user-roles/index.js';
import { UserShopsModule } from './entities/user-shops/index.js';
import { UsersModule } from './entities/users/index.js';

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
    SuppliersModule,
    WarehousesModule,
    SalesHistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
