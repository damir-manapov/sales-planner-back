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
  Req,
  UseGuards,
} from '@nestjs/common';
import type { PaginatedResponse } from '@sales-planner/shared';
import { AuthenticatedRequest, AuthGuard } from '../../auth/auth.guard.js';
import { SystemAdminGuard } from '../../auth/system-admin.guard.js';
import {
  type PaginationQuery,
  PaginationQuerySchema,
  ZodValidationPipe,
} from '../../common/index.js';
import {
  type CreateTenantRequest,
  CreateTenantRequestSchema,
  type CreateTenantWithShopDto,
  CreateTenantWithShopSchema,
  type UpdateTenantRequest,
  UpdateTenantSchema,
} from './tenants.schema.js';
import { type Tenant, TenantsService, type TenantWithShopAndApiKey } from './tenants.service.js';

@Controller('tenants')
@UseGuards(AuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @Query('owner_id') ownerId?: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query?: PaginationQuery,
  ): Promise<PaginatedResponse<Tenant>> {
    if (ownerId) {
      return this.tenantsService.findByOwnerIdPaginated(Number.parseInt(ownerId, 10), query);
    }
    return this.tenantsService.findAllPaginated(query);
  }

  @Get(':id')
  async findById(
    @Req() _req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Tenant> {
    const tenant = await this.tenantsService.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }
    return tenant;
  }

  @Post()
  @UseGuards(SystemAdminGuard)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(CreateTenantRequestSchema)) dto: CreateTenantRequest,
  ): Promise<Tenant> {
    return this.tenantsService.create({
      ...dto,
      created_by: req.user.id,
    });
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateTenantSchema)) dto: UpdateTenantRequest,
  ): Promise<Tenant> {
    const tenant = await this.tenantsService.update(id, dto);
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }
    return tenant;
  }

  @Delete(':id')
  async delete(
    @Req() _req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.tenantsService.delete(id);
  }

  @Post('with-shop-and-user')
  @UseGuards(SystemAdminGuard)
  async createWithShop(
    @Req() _req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(CreateTenantWithShopSchema)) dto: CreateTenantWithShopDto,
  ): Promise<TenantWithShopAndApiKey> {
    return this.tenantsService.createTenantWithShopAndUser(dto);
  }
}
