import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { ShopsModule } from '../shops/shops.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { UserShopsController } from './user-shops.controller.js';
import { UserShopsService } from './user-shops.service.js';

@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule, ShopsModule],
  controllers: [UserShopsController],
  providers: [UserShopsService, AuthGuard],
  exports: [UserShopsService],
})
export class UserShopsModule {}
