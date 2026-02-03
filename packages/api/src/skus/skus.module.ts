import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { SkusController } from './skus.controller.js';
import { SkusService } from './skus.service.js';
import { SkusExamplesController } from './skus-examples.controller.js';

@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule],
  controllers: [SkusController, SkusExamplesController],
  providers: [SkusService, AuthGuard],
  exports: [SkusService],
})
export class SkusModule {}
