import { forwardRef, Module } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard.js';
import { SystemAdminGuard } from '../../auth/system-admin.guard.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

@Module({
  imports: [forwardRef(() => UserRolesModule), forwardRef(() => TenantsModule)],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, AuthGuard, SystemAdminGuard],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
