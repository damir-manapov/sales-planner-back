import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../entities/api-keys/api-keys.module.js';
import { MarketplacesModule } from '../entities/marketplaces/marketplaces.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { UserRolesModule } from '../entities/user-roles/user-roles.module.js';
import { UsersModule } from '../entities/users/users.module.js';
import { BootstrapService } from './bootstrap.service.js';

@Module({
  imports: [UsersModule, RolesModule, UserRolesModule, ApiKeysModule, MarketplacesModule],
  providers: [BootstrapService],
})
export class BootstrapModule {}
