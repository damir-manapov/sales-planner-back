import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { SystemAdminGuard } from '../auth/system-admin.guard.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { MarketplacesController } from './marketplaces.controller.js';
import { MarketplacesService } from './marketplaces.service.js';
import { MarketplacesExamplesController } from './marketplaces-examples.controller.js';

@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule],
  controllers: [MarketplacesController, MarketplacesExamplesController],
  providers: [MarketplacesService, AuthGuard, SystemAdminGuard],
  exports: [MarketplacesService],
})
export class MarketplacesModule {}
