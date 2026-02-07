import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../entities/api-keys/api-keys.module.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { TenantsModule } from '../entities/tenants/tenants.module.js';
import { UserRolesModule } from '../entities/user-roles/user-roles.module.js';
import { ComputedEntitiesController } from './computed-entities.controller.js';
import { ComputedEntitiesService } from './computed-entities.service.js';
import { SkuMetricsModule } from './sku-metrics/sku-metrics.module.js';

@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule, SkuMetricsModule],
  controllers: [ComputedEntitiesController],
  providers: [ComputedEntitiesService, AuthGuard],
  exports: [ComputedEntitiesService, SkuMetricsModule],
})
export class ComputedEntitiesModule {}
