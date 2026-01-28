import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service.js';
import { RolesService } from '../roles/roles.service.js';
import { UserRolesService } from '../user-roles/user-roles.service.js';

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly userRolesService: UserRolesService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSystemAdmin();
  }

  private async ensureSystemAdmin(): Promise<void> {
    const systemAdminKey = this.configService.get<string>('SYSTEM_ADMIN_KEY');

    if (!systemAdminKey) {
      this.logger.warn('SYSTEM_ADMIN_KEY not set, skipping system admin initialization');
      return;
    }

    // Check if systemAdmin role exists
    let systemAdminRole = await this.rolesService.findByName('systemAdmin');
    if (!systemAdminRole) {
      this.logger.log('Creating systemAdmin role...');
      systemAdminRole = await this.rolesService.create({
        name: 'systemAdmin',
        description: 'System administrator with full access',
      });
    }

    // Check if any user has systemAdmin role
    const existingAdmins = await this.userRolesService.findByRoleId(systemAdminRole.id);
    if (existingAdmins.length > 0) {
      this.logger.log('System admin already exists, skipping initialization');
      return;
    }

    // Check if user with this API key already exists
    let adminUser = await this.usersService.findByApiKey(systemAdminKey);
    if (!adminUser) {
      this.logger.log('Creating system admin user...');
      adminUser = await this.usersService.create({
        email: 'admin@system.local',
        name: 'System Admin',
        api_key: systemAdminKey,
      });
    }

    // Assign systemAdmin role to user
    const hasRole = await this.userRolesService.hasRole(adminUser.id, 'systemAdmin');
    if (!hasRole) {
      this.logger.log('Assigning systemAdmin role to user...');
      await this.userRolesService.create({
        user_id: adminUser.id,
        role_id: systemAdminRole.id,
      });
    }

    this.logger.log('System admin initialization complete');
  }
}
