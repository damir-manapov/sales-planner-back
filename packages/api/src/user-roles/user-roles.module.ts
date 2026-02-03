import { forwardRef, Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesController } from './user-roles.controller.js';
import { UserRolesService } from './user-roles.service.js';

@Module({
  imports: [forwardRef(() => ApiKeysModule), forwardRef(() => TenantsModule)],
  controllers: [UserRolesController],
  providers: [UserRolesService, AuthGuard],
  exports: [UserRolesService],
})
export class UserRolesModule {}
