import { Module, forwardRef } from '@nestjs/common';
import { UserRolesController } from './user-roles.controller.js';
import { UserRolesService } from './user-roles.service.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Module({
  imports: [forwardRef(() => ApiKeysModule), forwardRef(() => TenantsModule)],
  controllers: [UserRolesController],
  providers: [UserRolesService, AuthGuard],
  exports: [UserRolesService],
})
export class UserRolesModule {}
