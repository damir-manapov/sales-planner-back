import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { PaginatedResponse, ApiKey } from '@sales-planner/shared';
import { AuthenticatedRequest, AuthGuard } from '../../auth/auth.guard.js';
import {
  type PaginationQuery,
  PaginationQuerySchema,
  ZodValidationPipe,
} from '../../common/index.js';
import { type CreateApiKeyRequest, CreateApiKeySchema } from './api-keys.schema.js';
import { ApiKeysService } from './api-keys.service';

@Controller('api-keys')
@UseGuards(AuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('userId') userId?: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query?: PaginationQuery,
  ): Promise<PaginatedResponse<ApiKey>> {
    // System admins can list all or filter by userId
    if (req.user.isSystemAdmin) {
      if (userId) {
        return this.apiKeysService.findByUserIdPaginated(Number.parseInt(userId, 10), query);
      }
      return this.apiKeysService.findAllPaginated(query);
    }
    // Regular users can only see their own keys
    return this.apiKeysService.findByUserIdPaginated(req.user.id, query);
  }

  @Get(':id')
  async findById(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiKey> {
    const apiKey = await this.apiKeysService.findById(id);
    if (!apiKey) {
      throw new NotFoundException(`API key with id ${id} not found`);
    }
    if (!req.user.isSystemAdmin && apiKey.userId !== req.user.id) {
      throw new ForbiddenException('Cannot access API keys of other users');
    }
    return apiKey;
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(CreateApiKeySchema))
    dto: CreateApiKeyRequest,
  ): Promise<ApiKey> {
    // Regular users can only create keys for themselves
    if (!req.user.isSystemAdmin && dto.userId !== req.user.id) {
      throw new ForbiddenException('Cannot create API keys for other users');
    }
    return this.apiKeysService.create(dto);
  }

  @Delete(':id')
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const apiKey = await this.apiKeysService.findById(id);
    if (!apiKey) {
      throw new NotFoundException(`API key with id ${id} not found`);
    }
    if (!req.user.isSystemAdmin && apiKey.userId !== req.user.id) {
      throw new ForbiddenException('Cannot delete API keys of other users');
    }
    await this.apiKeysService.delete(id);
  }
}
