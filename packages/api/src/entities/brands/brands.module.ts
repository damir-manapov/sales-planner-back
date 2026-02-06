import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../../api-keys/api-keys.module.js';
import { AuthGuard } from '../../auth/auth.guard.js';
import { TenantsModule } from '../../tenants/tenants.module.js';
import { UserRolesModule } from '../../user-roles/user-roles.module.js';
import { BrandsController } from './brands.controller.js';
import { BrandsExamplesController } from './brands-examples.controller.js';
import { BrandsService } from './brands.service.js';

@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule],
  controllers: [BrandsController, BrandsExamplesController],
  providers: [BrandsService, AuthGuard],
  exports: [BrandsService],
})
export class BrandsModule {}
