import { Module } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard.js';
import { DatabaseModule } from '../../database/database.module.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { GroupsModule } from '../groups/groups.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { SeasonalCoefficientsController } from './seasonal-coefficients.controller.js';
import { SeasonalCoefficientsService } from './seasonal-coefficients.service.js';

@Module({
  imports: [DatabaseModule, ApiKeysModule, UserRolesModule, TenantsModule, GroupsModule],
  controllers: [SeasonalCoefficientsController],
  providers: [SeasonalCoefficientsService, AuthGuard],
  exports: [SeasonalCoefficientsService],
})
export class SeasonalCoefficientsModule {}
