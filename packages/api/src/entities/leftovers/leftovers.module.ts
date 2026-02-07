import { Module, forwardRef } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard.js';
import { DatabaseModule } from '../../database/database.module.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { SkusModule } from '../skus/skus.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { WarehousesModule } from '../warehouses/warehouses.module.js';
import { LeftoversController } from './leftovers.controller.js';
import { LeftoversService } from './leftovers.service.js';

@Module({
  imports: [
    DatabaseModule,
    ApiKeysModule,
    UserRolesModule,
    TenantsModule,
    forwardRef(() => SkusModule),
    forwardRef(() => WarehousesModule),
  ],
  controllers: [LeftoversController],
  providers: [LeftoversService, AuthGuard],
  exports: [LeftoversService],
})
export class LeftoversModule {}
