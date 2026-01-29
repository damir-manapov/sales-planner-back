import { Controller, Get, Headers, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { ApiKeysService } from '../api-keys/api-keys.service.js';
import { UserRolesService } from '../user-roles/user-roles.service.js';
import { TenantsService } from '../tenants/tenants.service.js';

@Controller('me')
export class MeController {
  constructor(
    private readonly usersService: UsersService,
    private readonly apiKeysService: ApiKeysService,
    private readonly userRolesService: UserRolesService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Get()
  async getCurrentUser(@Headers('x-api-key') apiKey?: string) {
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const validApiKey = await this.apiKeysService.findValidByKey(apiKey);
    if (!validApiKey) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    const user = await this.usersService.getUserWithRolesAndTenants(validApiKey.user_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
