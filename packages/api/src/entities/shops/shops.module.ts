import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { AuthGuard } from '../../auth/auth.guard.js';
import { BrandsModule } from '../brands/brands.module.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { GroupsModule } from '../groups/groups.module.js';
import { MarketplacesModule } from '../marketplaces/marketplaces.module.js';
import { SalesHistoryModule } from '../sales-history/sales-history.module.js';
import { SkusModule } from '../skus/skus.module.js';
import { StatusesModule } from '../statuses/statuses.module.js';
import { SuppliersModule } from '../suppliers/suppliers.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { ShopsController } from './shops.controller.js';
import { ShopsService } from './shops.service.js';

@Module({
  imports: [
    ApiKeysModule,
    UserRolesModule,
    TenantsModule,
    SkusModule,
    SalesHistoryModule,
    MarketplacesModule,
    BrandsModule,
    CategoriesModule,
    GroupsModule,
    StatusesModule,
    SuppliersModule,
  ],
  controllers: [ShopsController],
  providers: [ShopsService, AuthGuard],
  exports: [ShopsService],
})
export class ShopsModule {}
