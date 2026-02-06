import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { PaginatedResponse } from '@sales-planner/shared';
import { AuthGuard } from '../auth/auth.guard.js';
import { SystemAdminGuard } from '../auth/system-admin.guard.js';
import { type PaginationQuery, PaginationQuerySchema, ZodValidationPipe } from '../common/index.js';
import {
  type CreateRoleRequest,
  CreateRoleSchema,
  type UpdateRoleRequest,
  UpdateRoleSchema,
} from './roles.schema.js';
import { type Role, RolesService } from './roles.service.js';

@Controller('roles')
@UseGuards(AuthGuard, SystemAdminGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query?: PaginationQuery,
  ): Promise<PaginatedResponse<Role>> {
    return this.rolesService.findAllPaginated(query);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Role> {
    const role = await this.rolesService.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }
    return role;
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateRoleSchema)) dto: CreateRoleRequest,
  ): Promise<Role> {
    return this.rolesService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateRoleSchema)) dto: UpdateRoleRequest,
  ): Promise<Role> {
    const role = await this.rolesService.update(id, dto);
    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }
    return role;
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.rolesService.delete(id);
  }
}
