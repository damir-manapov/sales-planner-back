import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard.js';
import { SystemAdminGuard } from '../../auth/system-admin.guard.js';
import { ZodValidationPipe } from '../../common/index.js';
import {
  type CreateApiKeyRequest,
  CreateApiKeySchema,
  type UpdateApiKeyRequest,
  UpdateApiKeySchema,
} from './api-keys.schema.js';
import { ApiKeysService } from './api-keys.service';

@Controller('api-keys')
@UseGuards(AuthGuard, SystemAdminGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  async findAll(@Query('user_id') userId?: string) {
    if (userId) {
      return this.apiKeysService.findByUserId(Number.parseInt(userId, 10));
    }
    return this.apiKeysService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.apiKeysService.findById(id);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateApiKeySchema))
    dto: CreateApiKeyRequest,
  ) {
    return this.apiKeysService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateApiKeySchema)) dto: UpdateApiKeyRequest,
  ) {
    return this.apiKeysService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.apiKeysService.delete(id);
  }
}
