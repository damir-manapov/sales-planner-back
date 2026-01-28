import { Module } from '@nestjs/common';
import { BootstrapService } from './bootstrap.service.js';
import { UsersModule } from '../users/users.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';

@Module({
  imports: [UsersModule, RolesModule, UserRolesModule, ApiKeysModule],
  providers: [BootstrapService],
})
export class BootstrapModule {}
