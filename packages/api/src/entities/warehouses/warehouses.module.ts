import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { AuthGuard } from '../../auth/auth.guard.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { WarehousesController } from './warehouses.controller.js';
import { WarehousesExamplesController } from './warehouses-examples.controller.js';
import { WarehousesRepository } from './warehouses.repository.js';
import { WarehousesService } from './warehouses.service.js';

@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule],
  controllers: [WarehousesController, WarehousesExamplesController],
  providers: [WarehousesRepository, WarehousesService, AuthGuard],
  exports: [WarehousesService],
})
export class WarehousesModule {}
