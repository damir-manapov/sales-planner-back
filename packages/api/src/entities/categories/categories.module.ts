import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../../api-keys/api-keys.module.js';
import { AuthGuard } from '../../auth/auth.guard.js';
import { TenantsModule } from '../../tenants/tenants.module.js';
import { UserRolesModule } from '../../user-roles/user-roles.module.js';
import { CategoriesController } from './categories.controller.js';
import { CategoriesExamplesController } from './categories-examples.controller.js';
import { CategoriesService } from './categories.service.js';

@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule],
  controllers: [CategoriesController, CategoriesExamplesController],
  providers: [CategoriesService, AuthGuard],
  exports: [CategoriesService],
})
export class CategoriesModule {}
