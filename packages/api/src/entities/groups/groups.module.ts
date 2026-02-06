import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { AuthGuard } from '../../auth/auth.guard.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { GroupsController } from './groups.controller.js';
import { GroupsExamplesController } from './groups-examples.controller.js';
import { GroupsRepository } from './groups.repository.js';
import { GroupsService } from './groups.service.js';

@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule],
  controllers: [GroupsController, GroupsExamplesController],
  providers: [GroupsRepository, GroupsService, AuthGuard],
  exports: [GroupsService],
})
export class GroupsModule {}
