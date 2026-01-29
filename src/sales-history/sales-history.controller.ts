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
import { parse } from 'csv-parse/sync';
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

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Query('period_from') periodFrom?: string,
    @Query('period_to') periodTo?: string,
  ): Promise<{ content: string }> {
    if (periodFrom && !isValidPeriod(periodFrom)) {
      throw new BadRequestException('period_from must be in YYYY-MM format');
    }
    if (periodTo && !isValidPeriod(periodTo)) {
      throw new BadRequestException('period_to must be in YYYY-MM format');
    }

    const items = await this.salesHistoryService.exportForShop(ctx.shopId, periodFrom, periodTo);
    const header = 'sku_code,period,quantity';
    const rows = items.map((item) => `${item.sku_code},${item.period},${item.quantity}`);
    return { content: [header, ...rows].join('\n') };
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

  @Post('import/csv')
  @RequireWriteAccess()
  async importCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() body: { content: string },
  ): Promise<ImportResult> {
    if (!body.content || typeof body.content !== 'string') {
      throw new BadRequestException('Body must contain a "content" string field with CSV data');
    }

    try {
      const records = parse(body.content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Array<Record<string, string>>;

      const items: ImportSalesHistoryItem[] = records.map((record) => {
        if (!record.sku_code) {
          throw new BadRequestException('CSV must have a "sku_code" column');
        }
        if (!record.period) {
          throw new BadRequestException('CSV must have a "period" column');
        }
        if (!record.quantity) {
          throw new BadRequestException('CSV must have a "quantity" column');
        }
        const quantity = Number.parseFloat(record.quantity);
        if (Number.isNaN(quantity)) {
          throw new BadRequestException(`Invalid quantity value: ${record.quantity}`);
        }
        return {
          sku_code: record.sku_code,
          period: record.period,
          quantity,
        };
      });

      return this.salesHistoryService.bulkUpsert(items, ctx.shopId, ctx.tenantId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
