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
import { type PaginationQuery, PaginationQuerySchema, ZodValidationPipe } from '../../common/index.js';
import { UserRolesService } from '../user-roles/user-roles.service.js';
import { type CreateUserRequest, CreateUserSchema } from './users.schema.js';
import { type User, UsersService } from './users.service.js';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userRolesService: UserRolesService,
  ) {}

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('tenantId') tenantId?: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query?: PaginationQuery,
  ): Promise<PaginatedResponse<User>> {
    // System admins can see all users
    if (req.user.isSystemAdmin) {
      if (tenantId) {
        return this.usersService.findByTenantIdPaginated(Number(tenantId), query);
      }
      return this.usersService.findAllPaginated(query);
    }

    // Tenant admins must specify a tenant they have access to
    if (!tenantId) {
      throw new ForbiddenException('tenantId query parameter is required');
    }

    const tid = Number(tenantId);
    if (!hasTenantAccess(req.user, tid)) {
      throw new ForbiddenException('Access to this tenant is not allowed');
    }

    return this.usersService.findByTenantIdPaginated(tid, query);
  }

  @Get(':id')
  async findById(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // System admins can view any user
    if (req.user.isSystemAdmin) {
      return user;
    }

    // Tenant admins can view users that have roles in their tenants
    const userRoles = await this.userRolesService.findByUserId(id);
    const hasAccessToUser = userRoles.some(
      (ur) => ur.tenant_id && hasTenantAccess(req.user, ur.tenant_id),
    );

    if (!hasAccessToUser) {
      throw new ForbiddenException('Access to this user is not allowed');
    }

    return user;
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Query('tenantId') tenantId?: string,
    @Body(new ZodValidationPipe(CreateUserSchema)) dto?: CreateUserRequest,
  ): Promise<User> {
    // System admins can create users without tenant context
    if (!req.user.isSystemAdmin) {
      if (!tenantId) {
        throw new ForbiddenException('tenantId query parameter is required');
      }
      validateTenantAdminAccess(req.user, Number(tenantId));
    }

    if (!dto) {
      throw new ForbiddenException('Request body is required');
    }

    return this.usersService.create(dto);
  }

  @Delete(':id')
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // System admins can delete any user
    if (req.user.isSystemAdmin) {
      return this.usersService.delete(id);
    }

    // Tenant admins can only delete users that belong exclusively to their tenants
    const userRoles = await this.userRolesService.findByUserId(id);

    // Check user has roles only in tenants the admin manages
    const allRolesInManagedTenants = userRoles.every(
      (ur) => ur.tenant_id && hasTenantAccess(req.user, ur.tenant_id),
    );

    if (!allRolesInManagedTenants) {
      throw new ForbiddenException('Cannot delete user with roles in other tenants');
    }

    await this.usersService.delete(id);
  }
}
