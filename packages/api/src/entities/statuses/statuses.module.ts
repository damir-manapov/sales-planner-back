import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { AuthGuard } from '../../auth/auth.guard.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { StatusesController } from './statuses.controller.js';
import { StatusesExamplesController } from './statuses-examples.controller.js';
import { StatusesService } from './statuses.service.js';

@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule],
  controllers: [StatusesController, StatusesExamplesController],
  providers: [StatusesService, AuthGuard],
  exports: [StatusesService],
})
export class StatusesModule {}
