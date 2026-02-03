import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { UsersModule } from '../users/users.module.js';
import { MeController } from './me.controller.js';

@Module({
  imports: [UsersModule, ApiKeysModule, UserRolesModule, TenantsModule],
  controllers: [MeController],
})
export class MeModule {}
