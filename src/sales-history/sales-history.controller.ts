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
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  SalesHistoryService,
  CreateSalesHistoryDto,
  UpdateSalesHistoryDto,
  SalesHistory,
} from './sales-history.service.js';
import { isValidPeriod } from '../lib/index.js';
import {
  AuthGuard,
  AuthenticatedRequest,
  RequireReadAccess,
  RequireWriteAccess,
  ShopContext,
  type ShopContextType,
} from '../auth/index.js';

interface ImportSalesHistoryItem {
  sku_code: string;
  period: string; // "YYYY-MM"
  quantity: number;
}

interface ImportResult {
  created: number;
  updated: number;
  skus_created: number;
  errors: string[];
}

@Controller('sales-history')
@UseGuards(AuthGuard)
export class SalesHistoryController {
  constructor(private readonly salesHistoryService: SalesHistoryService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Query('period_from') periodFrom?: string,
    @Query('period_to') periodTo?: string,
  ): Promise<SalesHistory[]> {
    if (periodFrom && !isValidPeriod(periodFrom)) {
      throw new BadRequestException('period_from must be in YYYY-MM format');
    }
    if (periodTo && !isValidPeriod(periodTo)) {
      throw new BadRequestException('period_to must be in YYYY-MM format');
    }

    return this.salesHistoryService.findByShopAndPeriod(ctx.shopId, periodFrom, periodTo);
  }

  @Get('export/json')
  @RequireReadAccess()
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Query('period_from') periodFrom?: string,
    @Query('period_to') periodTo?: string,
  ): Promise<Array<{ sku_code: string; period: string; quantity: number }>> {
    if (periodFrom && !isValidPeriod(periodFrom)) {
      throw new BadRequestException('period_from must be in YYYY-MM format');
    }
    if (periodTo && !isValidPeriod(periodTo)) {
      throw new BadRequestException('period_to must be in YYYY-MM format');
    }

    return this.salesHistoryService.exportForShop(ctx.shopId, periodFrom, periodTo);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SalesHistory> {
    const record = await this.salesHistoryService.findById(id);
    if (!record) {
      throw new NotFoundException(`Sales history record with id ${id} not found`);
    }

    if (record.shop_id !== ctx.shopId || record.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(
        `Sales history record with id ${id} not found in this shop/tenant`,
      );
    }

    return record;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() dto: Omit<CreateSalesHistoryDto, 'shop_id' | 'tenant_id'>,
  ): Promise<SalesHistory> {
    if (!isValidPeriod(dto.period)) {
      throw new BadRequestException('period must be in YYYY-MM format with valid month (01-12)');
    }

    return this.salesHistoryService.create({
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
    @Body() dto: UpdateSalesHistoryDto,
  ): Promise<SalesHistory> {
    const existing = await this.salesHistoryService.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sales history record with id ${id} not found`);
    }

    if (existing.shop_id !== ctx.shopId || existing.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(
        `Sales history record with id ${id} not found in this shop/tenant`,
      );
    }

    const updated = await this.salesHistoryService.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Sales history record with id ${id} not found`);
    }
    return updated;
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const existing = await this.salesHistoryService.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sales history record with id ${id} not found`);
    }

    if (existing.shop_id !== ctx.shopId || existing.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(
        `Sales history record with id ${id} not found in this shop/tenant`,
      );
    }

    await this.salesHistoryService.delete(id);
  }

  @Post('import')
  @RequireWriteAccess()
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() items: ImportSalesHistoryItem[],
  ): Promise<ImportResult> {
    if (!Array.isArray(items)) {
      throw new BadRequestException('Body must be an array of sales history items');
    }

    return this.salesHistoryService.bulkUpsert(items, ctx.shopId, ctx.tenantId);
  }
}
