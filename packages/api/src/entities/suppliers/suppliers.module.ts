import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { AuthGuard } from '../../auth/auth.guard.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { SuppliersController } from './suppliers.controller.js';
import { SuppliersExamplesController } from './suppliers-examples.controller.js';
import { SuppliersRepository } from './suppliers.repository.js';
import { SuppliersService } from './suppliers.service.js';

@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule],
  controllers: [SuppliersController, SuppliersExamplesController],
  providers: [SuppliersRepository, SuppliersService, AuthGuard],
  exports: [SuppliersService],
})
export class SuppliersModule {}
