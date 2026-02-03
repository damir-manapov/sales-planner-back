import { Module } from '@nestjs/common';
import { ShopsController } from './shops.controller.js';
import { ShopsService } from './shops.service.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { SkusModule } from '../skus/skus.module.js';
import { SalesHistoryModule } from '../sales-history/sales-history.module.js';

@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule, SkusModule, SalesHistoryModule],
  controllers: [ShopsController],
  providers: [ShopsService, AuthGuard],
  exports: [ShopsService],
})
export class ShopsModule {}
