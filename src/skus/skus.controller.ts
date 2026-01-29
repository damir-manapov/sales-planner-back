import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SkusService, CreateSkuDto, UpdateSkuDto, Sku } from './skus.service.js';
import { toCsv, fromCsv } from '../lib/index.js';
import {
  AuthGuard,
  AuthenticatedRequest,
  RequireReadAccess,
  RequireWriteAccess,
  ShopContext,
  type ShopContextType,
} from '../auth/index.js';

interface ImportSkuItem {
  code: string;
  title: string;
}

interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

@Controller('skus')
@UseGuards(AuthGuard)
export class SkusController {
  constructor(private readonly skusService: SkusService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
  ): Promise<Sku[]> {
    return this.skusService.findByShopId(ctx.shopId);
  }

  @Get('export/json')
  @RequireReadAccess()
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
  ): Promise<Array<{ code: string; title: string }>> {
    return this.skusService.exportForShop(ctx.shopId);
  }

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
  ): Promise<{ content: string }> {
    const items = await this.skusService.exportForShop(ctx.shopId);
    return { content: toCsv(items, ['code', 'title']) };
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Sku> {
    const sku = await this.skusService.findById(id);
    if (!sku) {
      throw new NotFoundException(`SKU with id ${id} not found`);
    }

    if (sku.shop_id !== ctx.shopId || sku.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`SKU with id ${id} not found in this shop/tenant`);
    }

    return sku;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() dto: Omit<CreateSkuDto, 'shop_id' | 'tenant_id'>,
  ): Promise<Sku> {
    return this.skusService.create({
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
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSkuDto,
  ): Promise<Sku> {
    const existing = await this.skusService.findById(id);
    if (!existing) {
      throw new NotFoundException(`SKU with id ${id} not found`);
    }

    if (existing.shop_id !== ctx.shopId || existing.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`SKU with id ${id} not found in this shop/tenant`);
    }

    const sku = await this.skusService.update(id, dto);
    if (!sku) {
      throw new NotFoundException(`SKU with id ${id} not found`);
    }
    return sku;
  }

  @Post('import/json')
  @RequireWriteAccess()
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() items: ImportSkuItem[],
  ): Promise<ImportResult> {
    if (!Array.isArray(items)) {
      throw new BadRequestException('Body must be an array of SKU items');
    }

    for (const item of items) {
      if (!item.code || typeof item.code !== 'string') {
        throw new BadRequestException('Each item must have a "code" string field');
      }
      if (!item.title || typeof item.title !== 'string') {
        throw new BadRequestException('Each item must have a "title" string field');
      }
    }

    return this.skusService.bulkUpsert(items, ctx.shopId, ctx.tenantId);
  }

  @Post('import/csv')
  @RequireWriteAccess()
  async importCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() body: { content: string },
  ): Promise<ImportResult> {
    const records = fromCsv<{ code: string; title: string }>(body.content, ['code', 'title']);
    const items: ImportSkuItem[] = records.map((record) => ({
      code: record.code,
      title: record.title,
    }));
    return this.skusService.bulkUpsert(items, ctx.shopId, ctx.tenantId);
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const existing = await this.skusService.findById(id);
    if (!existing) {
      throw new NotFoundException(`SKU with id ${id} not found`);
    }

    if (existing.shop_id !== ctx.shopId || existing.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`SKU with id ${id} not found in this shop/tenant`);
    }

    await this.skusService.delete(id);
  }
}
