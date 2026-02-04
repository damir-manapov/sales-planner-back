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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { SystemAdminGuard } from '../auth/system-admin.guard.js';
import { ZodValidationPipe } from '../common/index.js';
import {
  CreateRoleSchema,
  UpdateRoleSchema,
  type CreateRoleRequest,
  type UpdateRoleRequest,
} from './roles.schema.js';
import { type Role, RolesService } from './roles.service.js';

@Controller('roles')
@UseGuards(AuthGuard, SystemAdminGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(): Promise<Role[]> {
    return this.rolesService.findAll();
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
