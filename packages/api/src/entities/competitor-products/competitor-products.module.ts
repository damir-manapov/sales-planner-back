import { Module } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard.js';
import { DatabaseModule } from '../../database/database.module.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { MarketplacesModule } from '../marketplaces/marketplaces.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { CompetitorProductsController } from './competitor-products.controller.js';
import { CompetitorProductsService } from './competitor-products.service.js';

@Module({
  imports: [DatabaseModule, ApiKeysModule, UserRolesModule, TenantsModule, MarketplacesModule],
  controllers: [CompetitorProductsController],
  providers: [CompetitorProductsService, AuthGuard],
  exports: [CompetitorProductsService],
})
export class CompetitorProductsModule {}
