import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeysService } from '../api-keys/api-keys.service.js';
import { ROLE_NAMES } from '../common/constants.js';
import { RolesService } from '../roles/roles.service.js';
import { UserRolesService } from '../user-roles/user-roles.service.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly userRolesService: UserRolesService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedRoles();
    await this.ensureSystemAdmin();
    // Note: Marketplaces are now shop-specific and created on-demand
  }

  private async seedRoles(): Promise<void> {
    const roles = [
      { name: ROLE_NAMES.VIEWER, description: 'Read-only access to a shop' },
      { name: ROLE_NAMES.EDITOR, description: 'Can create and edit content in a shop' },
      { name: ROLE_NAMES.TENANT_ADMIN, description: 'Full access to all shops in a tenant' },
    ];

    for (const role of roles) {
      const existing = await this.rolesService.findByName(role.name);
      if (!existing) {
        try {
          this.logger.log(`Creating role: ${role.name}`);
          await this.rolesService.create(role);
        } catch (error) {
          // Ignore duplicate key errors (race condition in parallel tests)
          if (
            error instanceof Error &&
            error.message.includes('duplicate key value violates unique constraint')
          ) {
            this.logger.debug(`Role ${role.name} already exists (created by another process)`);
          } else {
            throw error;
          }
        }
      }
    }
    this.logger.log('Roles seeding complete');
  }

  private async ensureSystemAdmin(): Promise<void> {
    const systemAdminKey = this.configService.get<string>('SYSTEM_ADMIN_KEY');

    if (!systemAdminKey) {
      this.logger.warn('SYSTEM_ADMIN_KEY not set, skipping system admin initialization');
      return;
    }

    // Check if systemAdmin role exists
    let systemAdminRole = await this.rolesService.findByName(ROLE_NAMES.SYSTEM_ADMIN);
    if (!systemAdminRole) {
      this.logger.log('Creating systemAdmin role...');
      systemAdminRole = await this.rolesService.create({
        name: ROLE_NAMES.SYSTEM_ADMIN,
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
    const existingApiKey = await this.apiKeysService.findByKey(systemAdminKey);
    let adminUser = existingApiKey
      ? await this.usersService.findById(existingApiKey.user_id)
      : undefined;

    if (!adminUser) {
      this.logger.log('Creating system admin user...');
      try {
        adminUser = await this.usersService.create({
          email: 'admin@system.local',
          name: 'System Admin',
        });

        // Create API key for admin
        await this.apiKeysService.createWithKey({
          user_id: adminUser.id,
          key: systemAdminKey,
          name: 'System Admin Key',
        });
      } catch (error) {
        // Handle race condition: another process may have created the user
        // Try to find the user by email
        const users = await this.usersService.findAll();
        adminUser = users.find((u) => u.email === 'admin@system.local');
        if (!adminUser) {
          throw error; // Re-throw if it's not a duplicate error
        }
        this.logger.log('System admin user already exists (created by another process)');
      }
    }

    // Assign systemAdmin role to user
    const hasRole = await this.userRolesService.hasRole(adminUser.id, ROLE_NAMES.SYSTEM_ADMIN);
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
