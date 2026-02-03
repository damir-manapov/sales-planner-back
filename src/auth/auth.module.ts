import { Module, Global } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';

@Global()
@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
