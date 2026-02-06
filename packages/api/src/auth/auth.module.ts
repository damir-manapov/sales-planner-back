import { Global, Module } from '@nestjs/common';
import { ApiKeysModule } from '../entities/api-keys/api-keys.module.js';
import { TenantsModule } from '../entities/tenants/tenants.module.js';
import { UserRolesModule } from '../entities/user-roles/user-roles.module.js';
import { AuthGuard } from './auth.guard.js';

@Global()
@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
