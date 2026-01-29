import { Module, Global } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';

@Global()
@Module({
  imports: [ApiKeysModule, UserRolesModule],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
