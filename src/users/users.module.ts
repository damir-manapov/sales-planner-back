import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Module({
  imports: [ApiKeysModule, forwardRef(() => UserRolesModule), TenantsModule],
  controllers: [UsersController],
  providers: [UsersService, AuthGuard],
  exports: [UsersService],
})
export class UsersModule {}
