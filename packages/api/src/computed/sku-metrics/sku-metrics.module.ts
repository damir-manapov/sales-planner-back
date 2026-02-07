import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../../entities/api-keys/api-keys.module.js';
import { AuthGuard } from '../../auth/auth.guard.js';
import { TenantsModule } from '../../entities/tenants/tenants.module.js';
import { UserRolesModule } from '../../entities/user-roles/user-roles.module.js';
import { SkuMetricsController } from './sku-metrics.controller.js';
import { SkuMetricsRepository } from './sku-metrics.repository.js';
import { SkuMetricsService } from './sku-metrics.service.js';

@Module({
  imports: [ApiKeysModule, UserRolesModule, TenantsModule],
  controllers: [SkuMetricsController],
  providers: [SkuMetricsRepository, SkuMetricsService, AuthGuard],
  exports: [SkuMetricsService],
})
export class SkuMetricsModule {}
