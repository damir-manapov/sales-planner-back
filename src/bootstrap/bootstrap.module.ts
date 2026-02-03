import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { MarketplacesModule } from '../marketplaces/marketplaces.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { UsersModule } from '../users/users.module.js';
import { BootstrapService } from './bootstrap.service.js';

@Module({
  imports: [UsersModule, RolesModule, UserRolesModule, ApiKeysModule, MarketplacesModule],
  providers: [BootstrapService],
})
export class BootstrapModule {}
