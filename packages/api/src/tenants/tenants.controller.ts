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
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard.js';
import { SystemAdminGuard } from '../auth/system-admin.guard.js';
import {
  CreateTenantDto,
  CreateTenantWithShopDto,
  Tenant,
  TenantsService,
  TenantWithShopAndApiKey,
} from './tenants.service.js';

@Controller('tenants')
@UseGuards(AuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @Query('owner_id') ownerId?: string,
  ): Promise<Tenant[]> {
    if (ownerId) {
      return this.tenantsService.findByOwnerId(Number.parseInt(ownerId, 10));
    }
    return this.tenantsService.findAll();
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
    @Body() dto: Omit<CreateTenantDto, 'created_by'>,
  ): Promise<Tenant> {
    return this.tenantsService.create({
      ...dto,
      created_by: req.user.id,
    });
  }

  @Put(':id')
  async update(
    @Req() _req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<Omit<CreateTenantDto, 'created_by'>>,
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
    @Body() dto: CreateTenantWithShopDto,
  ): Promise<TenantWithShopAndApiKey> {
    return this.tenantsService.createTenantWithShopAndUser(dto);
  }
}
