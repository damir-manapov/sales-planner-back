import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { GroupsModule } from '../groups/groups.module.js';
import { StatusesModule } from '../statuses/statuses.module.js';
import { SuppliersModule } from '../suppliers/suppliers.module.js';
import { SkusController } from './skus.controller.js';
import { SkusService } from './skus.service.js';
import { SkusRepository } from './skus.repository.js';
import { SkusExamplesController } from './skus-examples.controller.js';

@Module({
  imports: [
    ApiKeysModule,
    UserRolesModule,
    TenantsModule,
    CategoriesModule,
    GroupsModule,
    StatusesModule,
    SuppliersModule,
  ],
  controllers: [SkusController, SkusExamplesController],
  providers: [SkusService, SkusRepository, AuthGuard],
  exports: [SkusService],
})
export class SkusModule {}
