import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../../api-keys/api-keys.module.js';
import { AuthGuard } from '../../auth/auth.guard.js';
import { MarketplacesModule } from '../../marketplaces/marketplaces.module.js';
import { SkusModule } from '../skus/skus.module.js';
import { TenantsModule } from '../../tenants/tenants.module.js';
import { UserRolesModule } from '../../user-roles/user-roles.module.js';
import { SalesHistoryController } from './sales-history.controller.js';
import { SalesHistoryService } from './sales-history.service.js';
import { SalesHistoryExamplesController } from './sales-history-examples.controller.js';

@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule, SkusModule, MarketplacesModule],
  controllers: [SalesHistoryExamplesController, SalesHistoryController],
  providers: [SalesHistoryService, AuthGuard],
  exports: [SalesHistoryService],
})
export class SalesHistoryModule {}
