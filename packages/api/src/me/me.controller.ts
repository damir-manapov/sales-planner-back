import { Controller, Get, Headers, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from '../entities/api-keys/api-keys.service.js';
import { UsersService } from '../entities/users/users.service.js';

@Controller('me')
export class MeController {
  constructor(
    private readonly usersService: UsersService,
    private readonly apiKeysService: ApiKeysService,
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
