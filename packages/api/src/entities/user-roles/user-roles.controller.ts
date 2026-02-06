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
import type { PaginatedResponse } from '@sales-planner/shared';
import { hasTenantAccess, validateTenantAdminAccess } from '../../auth/access-control.js';
import { AuthenticatedRequest, AuthGuard } from '../../auth/auth.guard.js';
import {
  type PaginationQuery,
  PaginationQuerySchema,
  ZodValidationPipe,
} from '../../common/index.js';
import { CreateUserRoleDto, UserRole, UserRolesService } from './user-roles.service.js';

@Controller('user-roles')
@UseGuards(AuthGuard)
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('userId') userId?: string,
    @Query('roleId') roleId?: string,
    @Query('tenantId') tenantId?: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query?: PaginationQuery,
  ): Promise<PaginatedResponse<UserRole>> {
    // System admins can see all
    if (req.user.isSystemAdmin) {
      if (tenantId) {
        return this.userRolesService.findByTenantIdPaginated(Number(tenantId), query);
      }
      if (userId) {
        return this.userRolesService.findByUserIdPaginated(Number(userId), query);
      }
      if (roleId) {
        return this.userRolesService.findByRoleIdPaginated(Number(roleId), query);
      }
      return this.userRolesService.findAllPaginated(query);
    }

    // Tenant admins must specify a tenant
    if (!tenantId) {
      throw new ForbiddenException('tenantId query parameter is required');
    }

    const tid = Number(tenantId);
    if (!hasTenantAccess(req.user, tid)) {
      throw new ForbiddenException('Access to this tenant is not allowed');
    }

    // For tenant admins with additional filters, we fetch all and filter in memory
    // Note: This doesn't support pagination efficiently when filtering by userId/roleId
    let roles = await this.userRolesService.findByTenantId(tid);

    // Filter by additional params if provided
    if (userId) {
      roles = roles.filter((r) => r.user_id === Number(userId));
    }
    if (roleId) {
      roles = roles.filter((r) => r.role_id === Number(roleId));
    }

    return {
      items: roles,
      total: roles.length,
      limit: query?.limit ?? 0,
      offset: query?.offset ?? 0,
    };
  }

  @Get(':id')
  async findById(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserRole> {
    const userRole = await this.userRolesService.findById(id);
    if (!userRole) {
      throw new NotFoundException(`UserRole with id ${id} not found`);
    }

    // Validate access
    if (!req.user.isSystemAdmin) {
      if (!userRole.tenant_id || !hasTenantAccess(req.user, userRole.tenant_id)) {
        throw new ForbiddenException('Access to this user role is not allowed');
      }
    }

    return userRole;
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateUserRoleDto,
  ): Promise<UserRole> {
    // Validate user can assign roles in this tenant
    if (!req.user.isSystemAdmin) {
      if (!dto.tenant_id) {
        throw new ForbiddenException('tenant_id is required');
      }
      validateTenantAdminAccess(req.user, dto.tenant_id);
    }

    return this.userRolesService.create(dto);
  }

  @Delete(':id')
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const userRole = await this.userRolesService.findById(id);
    if (!userRole) {
      throw new NotFoundException(`UserRole with id ${id} not found`);
    }

    // Validate access
    if (!req.user.isSystemAdmin) {
      if (!userRole.tenant_id || !hasTenantAccess(req.user, userRole.tenant_id)) {
        throw new ForbiddenException('Cannot delete user role from another tenant');
      }
    }

    await this.userRolesService.delete(id);
  }
}
