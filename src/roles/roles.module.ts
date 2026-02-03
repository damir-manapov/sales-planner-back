import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller.js';
import { RolesService } from './roles.service.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { SystemAdminGuard } from '../auth/system-admin.guard.js';

@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule],
  controllers: [RolesController],
  providers: [RolesService, AuthGuard, SystemAdminGuard],
  exports: [RolesService],
})
export class RolesModule {}
