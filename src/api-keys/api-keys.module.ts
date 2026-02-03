import { Module, forwardRef } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { SystemAdminGuard } from '../auth/system-admin.guard.js';

@Module({
  imports: [forwardRef(() => UserRolesModule), forwardRef(() => TenantsModule)],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, AuthGuard, SystemAdminGuard],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
