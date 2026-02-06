import { forwardRef, Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { DatabaseModule } from '../../database/database.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { TenantsController } from './tenants.controller.js';
import { TenantsService } from './tenants.service.js';

@Module({
  imports: [DatabaseModule, forwardRef(() => ApiKeysModule), forwardRef(() => UserRolesModule)],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
