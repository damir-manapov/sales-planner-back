import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { PaginatedResponse } from '@sales-planner/shared';
import { AuthGuard } from '../auth/auth.guard.js';
import { type PaginationQuery, PaginationQuerySchema, ZodValidationPipe } from '../common/index.js';
import { type Role, RolesService } from './roles.service.js';

@Controller('roles')
@UseGuards(AuthGuard)
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
}
