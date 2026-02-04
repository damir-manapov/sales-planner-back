import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import {
  RequireReadAccess,
  RequireWriteAccess,
  ShopContext,
  type ShopContext as ShopContextType,
} from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/index.js';
import {
  type CreateMarketplaceRequest,
  CreateMarketplaceSchema,
  type UpdateMarketplaceRequest,
  UpdateMarketplaceSchema,
} from './marketplaces.schema.js';
import { type Marketplace, MarketplacesService } from './marketplaces.service.js';

@Controller('marketplaces')
@UseGuards(AuthGuard)
export class MarketplacesController {
  constructor(private readonly marketplacesService: MarketplacesService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
  ): Promise<Marketplace[]> {
    return this.marketplacesService.findByShopId(ctx.shopId);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id') id: string,
  ): Promise<Marketplace> {
    const marketplace = await this.marketplacesService.findById(id, ctx.shopId);
    if (!marketplace) {
      throw new NotFoundException(`Marketplace with id ${id} not found`);
    }

    return marketplace;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(new ZodValidationPipe(CreateMarketplaceSchema)) dto: CreateMarketplaceRequest,
  ): Promise<Marketplace> {
    return this.marketplacesService.create({
      ...dto,
      shop_id: ctx.shopId,
      tenant_id: ctx.tenantId,
    });
  }

  @Put(':id')
  @RequireWriteAccess()
  async update(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateMarketplaceSchema)) dto: UpdateMarketplaceRequest,
  ): Promise<Marketplace> {
    const marketplace = await this.marketplacesService.update(id, ctx.shopId, dto);
    if (!marketplace) {
      throw new NotFoundException(`Marketplace with id ${id} not found`);
    }
    return marketplace;
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id') id: string,
  ): Promise<void> {
    await this.marketplacesService.delete(id, ctx.shopId);
  }
}
