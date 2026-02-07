import { Module, forwardRef } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard.js';
import { DatabaseModule } from '../../database/database.module.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { CompetitorProductsModule } from '../competitor-products/competitor-products.module.js';
import { MarketplacesModule } from '../marketplaces/index.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { CompetitorSalesController } from './competitor-sales.controller.js';
import { CompetitorSalesService } from './competitor-sales.service.js';

@Module({
  imports: [
    DatabaseModule,
    ApiKeysModule,
    UserRolesModule,
    TenantsModule,
    forwardRef(() => MarketplacesModule),
    forwardRef(() => CompetitorProductsModule),
  ],
  controllers: [CompetitorSalesController],
  providers: [CompetitorSalesService, AuthGuard],
  exports: [CompetitorSalesService],
})
export class CompetitorSalesModule {}
