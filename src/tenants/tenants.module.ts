import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller.js';
import { TenantsService } from './tenants.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';

@Module({
  imports: [DatabaseModule, ApiKeysModule, UserRolesModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
