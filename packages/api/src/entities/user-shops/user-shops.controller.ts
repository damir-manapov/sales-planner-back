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
import { hasTenantAccess, validateTenantAdminAccess } from '../../auth/access-control.js';
import { AuthenticatedRequest, AuthGuard } from '../../auth/auth.guard.js';
import { ShopsService } from '../shops/shops.service.js';
import { CreateUserShopDto, UserShop, UserShopsService } from './user-shops.service.js';

@Controller('user-shops')
@UseGuards(AuthGuard)
export class UserShopsController {
  constructor(
    private readonly userShopsService: UserShopsService,
    private readonly shopsService: ShopsService,
  ) {}

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('userId') userId?: string,
    @Query('shopId') shopId?: string,
    @Query('tenantId') tenantId?: string,
  ): Promise<UserShop[]> {
    // System admins can see all
    if (req.user.isSystemAdmin) {
      if (userId) {
        return this.userShopsService.findByUserId(Number(userId));
      }
      if (shopId) {
        return this.userShopsService.findByShopId(Number(shopId));
      }
      return this.userShopsService.findAll();
    }

    // Tenant admins need to filter by shop within their tenant
    if (shopId) {
      const shop = await this.shopsService.findById(Number(shopId));
      if (!shop || !hasTenantAccess(req.user, shop.tenant_id)) {
        throw new ForbiddenException('Access to this shop is not allowed');
      }
      return this.userShopsService.findByShopId(Number(shopId));
    }

    if (tenantId) {
      const tid = Number(tenantId);
      if (!hasTenantAccess(req.user, tid)) {
        throw new ForbiddenException('Access to this tenant is not allowed');
      }
      return this.userShopsService.findByTenantId(tid);
    }

    throw new ForbiddenException('shopId or tenantId query parameter is required');
  }

  @Get(':id')
  async findById(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserShop> {
    const userShop = await this.userShopsService.findById(id);
    if (!userShop) {
      throw new NotFoundException(`UserShop with id ${id} not found`);
    }

    // Validate access via shop's tenant
    if (!req.user.isSystemAdmin) {
      const shop = await this.shopsService.findById(userShop.shop_id);
      if (!shop || !hasTenantAccess(req.user, shop.tenant_id)) {
        throw new ForbiddenException('Access to this user-shop is not allowed');
      }
    }

    return userShop;
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateUserShopDto,
  ): Promise<UserShop> {
    // Validate user can manage this shop
    if (!req.user.isSystemAdmin) {
      const shop = await this.shopsService.findById(dto.shop_id);
      if (!shop) {
        throw new NotFoundException(`Shop with id ${dto.shop_id} not found`);
      }
      validateTenantAdminAccess(req.user, shop.tenant_id);
    }

    return this.userShopsService.create(dto);
  }

  @Delete(':id')
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const userShop = await this.userShopsService.findById(id);
    if (!userShop) {
      throw new NotFoundException(`UserShop with id ${id} not found`);
    }

    // Validate access via shop's tenant
    if (!req.user.isSystemAdmin) {
      const shop = await this.shopsService.findById(userShop.shop_id);
      if (!shop || !hasTenantAccess(req.user, shop.tenant_id)) {
        throw new ForbiddenException('Cannot delete user-shop from another tenant');
      }
    }

    await this.userShopsService.delete(id);
  }
}
