import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ShopsService, CreateShopDto, Shop } from './shops.service.js';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard.js';
import {
  validateWriteAccess,
  validateTenantAdminAccess,
  hasTenantAccess,
} from '../auth/access-control.js';

@Controller('shops')
@UseGuards(AuthGuard)
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('tenantId') tenantId?: string,
  ): Promise<Shop[]> {
    // System admins can see all shops
    if (req.user.isSystemAdmin) {
      if (tenantId) {
        return this.shopsService.findByTenantId(Number(tenantId));
      }
      return this.shopsService.findAll();
    }

    // Tenant admins/owners can only see shops in their tenants
    if (tenantId) {
      const tid = Number(tenantId);
      if (!hasTenantAccess(req.user, tid)) {
        throw new ForbiddenException('Access to this tenant is not allowed');
      }
      return this.shopsService.findByTenantId(tid);
    }

    // Return shops from all tenants user has access to
    const allShops: Shop[] = [];
    for (const tid of req.user.ownedTenantIds) {
      const shops = await this.shopsService.findByTenantId(tid);
      allShops.push(...shops);
    }
    // Also include tenants where user is admin
    for (const tr of req.user.tenantRoles) {
      if (!req.user.ownedTenantIds.includes(tr.tenantId)) {
        const shops = await this.shopsService.findByTenantId(tr.tenantId);
        allShops.push(...shops);
      }
    }
    return allShops;
  }

  @Get(':id')
  async findById(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Shop> {
    const shop = await this.shopsService.findById(id);
    if (!shop) {
      throw new NotFoundException(`Shop with id ${id} not found`);
    }

    // Validate access
    if (!req.user.isSystemAdmin && !hasTenantAccess(req.user, shop.tenant_id)) {
      throw new ForbiddenException('Access to this shop is not allowed');
    }

    return shop;
  }

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateShopDto): Promise<Shop> {
    // Validate user can create shops in this tenant
    validateTenantAdminAccess(req.user, dto.tenant_id);
    return this.shopsService.create(dto);
  }

  @Put(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateShopDto>,
  ): Promise<Shop> {
    const shop = await this.shopsService.findById(id);
    if (!shop) {
      throw new NotFoundException(`Shop with id ${id} not found`);
    }

    // Validate user can update shops in this tenant
    validateTenantAdminAccess(req.user, shop.tenant_id);

    const updated = await this.shopsService.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Shop with id ${id} not found`);
    }
    return updated;
  }

  @Delete(':id')
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const shop = await this.shopsService.findById(id);
    if (!shop) {
      throw new NotFoundException(`Shop with id ${id} not found`);
    }

    // Validate user can delete shops in this tenant
    validateTenantAdminAccess(req.user, shop.tenant_id);

    await this.shopsService.delete(id);
  }

  @Delete(':id/data')
  async deleteData(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ skusDeleted: number; salesHistoryDeleted: number }> {
    const shop = await this.shopsService.findById(id);
    if (!shop) {
      throw new NotFoundException(`Shop with id ${id} not found`);
    }

    // Validate user has write access to this shop
    validateWriteAccess(req.user, id, shop.tenant_id);

    return this.shopsService.deleteData(id);
  }
}
