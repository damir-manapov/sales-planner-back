import { Module } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard.js';
import { DatabaseModule } from '../../database/database.module.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { CompetitorProductsModule } from '../competitor-products/competitor-products.module.js';
import { MarketplacesModule } from '../marketplaces/marketplaces.module.js';
import { SkusModule } from '../skus/skus.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { SkuCompetitorMappingsController } from './sku-competitor-mappings.controller.js';
import { SkuCompetitorMappingsService } from './sku-competitor-mappings.service.js';

@Module({
  imports: [
    DatabaseModule,
    ApiKeysModule,
    UserRolesModule,
    TenantsModule,
    SkusModule,
    MarketplacesModule,
    CompetitorProductsModule,
  ],
  controllers: [SkuCompetitorMappingsController],
  providers: [SkuCompetitorMappingsService, AuthGuard],
  exports: [SkuCompetitorMappingsService],
})
export class SkuCompetitorMappingsModule {}
