import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../entities/api-keys/api-keys.module.js';
import { TenantsModule } from '../entities/tenants/tenants.module.js';
import { UserRolesModule } from '../entities/user-roles/user-roles.module.js';
import { UsersModule } from '../entities/users/users.module.js';
import { MeController } from './me.controller.js';

@Module({
  imports: [UsersModule, ApiKeysModule, UserRolesModule, TenantsModule],
  controllers: [MeController],
})
export class MeModule {}
