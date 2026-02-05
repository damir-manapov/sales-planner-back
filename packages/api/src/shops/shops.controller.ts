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
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { DeleteDataResult } from '@sales-planner/shared';
import {
  hasReadAccess,
  hasTenantAccess,
  validateTenantAdminAccess,
  validateWriteAccess,
} from '../auth/access-control.js';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type CreateShopRequest,
  CreateShopSchema,
  type UpdateShopRequest,
  UpdateShopSchema,
} from './shops.schema.js';
import { type Shop, ShopsService } from './shops.service.js';

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

    // If tenantId is specified, check access
    if (tenantId) {
      const tid = Number(tenantId);
      if (!hasTenantAccess(req.user, tid)) {
        throw new ForbiddenException('Access to this tenant is not allowed');
      }
      return this.shopsService.findByTenantId(tid);
    }

    // Return shops from all tenants user has access to
    const allShops: Shop[] = [];
    const addedShopIds = new Set<number>();

    // Include shops from owned tenants
    for (const tid of req.user.ownedTenantIds) {
      const shops = await this.shopsService.findByTenantId(tid);
      for (const shop of shops) {
        if (!addedShopIds.has(shop.id)) {
          allShops.push(shop);
          addedShopIds.add(shop.id);
        }
      }
    }

    // Include shops from tenants where user is admin
    for (const tr of req.user.tenantRoles) {
      if (!req.user.ownedTenantIds.includes(tr.tenantId)) {
        const shops = await this.shopsService.findByTenantId(tr.tenantId);
        for (const shop of shops) {
          if (!addedShopIds.has(shop.id)) {
            allShops.push(shop);
            addedShopIds.add(shop.id);
          }
        }
      }
    }

    // Include shops where user has shop-level roles (editor/viewer)
    for (const sr of req.user.shopRoles) {
      if (!addedShopIds.has(sr.shopId)) {
        const shop = await this.shopsService.findById(sr.shopId);
        if (shop) {
          allShops.push(shop);
          addedShopIds.add(shop.id);
        }
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

    // System admins can access any shop
    if (req.user.isSystemAdmin) {
      return shop;
    }

    // Check tenant-level access (owner/admin) or shop-level access (editor/viewer)
    if (!hasReadAccess(req.user, shop.id, shop.tenant_id)) {
      throw new ForbiddenException('Access to this shop is not allowed');
    }

    return shop;
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(CreateShopSchema)) dto: CreateShopRequest,
  ): Promise<Shop> {
    // Validate user can create shops in this tenant
    validateTenantAdminAccess(req.user, dto.tenant_id);
    return this.shopsService.create(dto);
  }

  @Put(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateShopSchema)) dto: UpdateShopRequest,
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
  ): Promise<DeleteDataResult> {
    const shop = await this.shopsService.findById(id);
    if (!shop) {
      throw new NotFoundException(`Shop with id ${id} not found`);
    }

    // Validate user has write access to this shop
    validateWriteAccess(req.user, id, shop.tenant_id);

    return this.shopsService.deleteData(id);
  }
}
