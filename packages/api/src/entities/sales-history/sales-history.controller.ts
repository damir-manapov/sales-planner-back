import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { PaginatedResponse, SalesHistoryImportResult } from '@sales-planner/shared';
import { AuthenticatedRequest, AuthGuard } from '../../auth/auth.guard.js';
import {
  RequireReadAccess,
  RequireWriteAccess,
  ShopContext,
  type ShopContext as ShopContextType,
} from '../../auth/decorators.js';
import {
  assertShopAccess,
  type ExpressResponse,
  parseAndValidateImport,
  sendCsvExport,
  sendJsonExport,
  ZodValidationPipe,
} from '../../common/index.js';
import { fromCsv } from '../../lib/index.js';
import {
  type CreateSalesHistoryRequest,
  CreateSalesHistorySchema,
  type ImportSalesHistoryItem,
  ImportSalesHistoryItemSchema,
  PeriodQuerySchema,
  type SalesHistoryQuery,
  SalesHistoryQuerySchema,
  type UpdateSalesHistoryRequest,
  UpdateSalesHistorySchema,
} from './sales-history.schema.js';
import { type SalesHistory, SalesHistoryService } from './sales-history.service.js';

@Controller('sales-history')
@UseGuards(AuthGuard)
export class SalesHistoryController {
  constructor(private readonly salesHistoryService: SalesHistoryService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Query(new ZodValidationPipe(SalesHistoryQuerySchema)) query: SalesHistoryQuery,
  ): Promise<PaginatedResponse<SalesHistory>> {
    return this.salesHistoryService.findByShopAndPeriod(ctx.shopId, query);
  }

  @Get('export/json')
  @RequireReadAccess()
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
    @Query('period_from') periodFrom?: string,
    @Query('period_to') periodTo?: string,
  ): Promise<void> {
    // Validate query params
    PeriodQuerySchema.parse({ period_from: periodFrom, period_to: periodTo });
    const items = await this.salesHistoryService.exportForShop(ctx.shopId, periodFrom, periodTo);
    sendJsonExport(res, items, 'sales-history.json');
  }

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
    @Query('period_from') periodFrom?: string,
    @Query('period_to') periodTo?: string,
  ): Promise<void> {
    // Validate query params
    PeriodQuerySchema.parse({ period_from: periodFrom, period_to: periodTo });
    const items = await this.salesHistoryService.exportForShop(ctx.shopId, periodFrom, periodTo);
    sendCsvExport(res, items, 'sales-history.csv', ['marketplace', 'period', 'sku', 'quantity']);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SalesHistory> {
    const record = await this.salesHistoryService.findById(id);
    assertShopAccess(record, ctx, 'Sales history record', id);
    return record;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(new ZodValidationPipe(CreateSalesHistorySchema.omit({ shop_id: true, tenant_id: true })))
    dto: CreateSalesHistoryRequest,
  ): Promise<SalesHistory> {
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
    @Body(new ZodValidationPipe(UpdateSalesHistorySchema)) dto: UpdateSalesHistoryRequest,
  ): Promise<SalesHistory> {
    const record = await this.salesHistoryService.findById(id);
    assertShopAccess(record, ctx, 'Sales history record', id);
    return this.salesHistoryService.update(id, dto);
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const record = await this.salesHistoryService.findById(id);
    assertShopAccess(record, ctx, 'Sales history record', id);

    await this.salesHistoryService.delete(id);
  }

  @Post('import/json')
  @RequireWriteAccess()
  @UseInterceptors(FileInterceptor('file'))
  async import(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() items?: ImportSalesHistoryItem[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SalesHistoryImportResult> {
    const validatedData = parseAndValidateImport(file, items, ImportSalesHistoryItemSchema);
    return this.salesHistoryService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
  }

  @Post('import/csv')
  @RequireWriteAccess()
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SalesHistoryImportResult> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const content = file.buffer.toString('utf-8');
    const records = fromCsv<{
      marketplace: string;
      period: string;
      sku: string;
      quantity: string;
    }>(content, ['marketplace', 'period', 'sku', 'quantity']);

    // Validate and transform each record with Zod
    const validatedData = records.map((record, index) => {
      const quantity = Number.parseFloat(record.quantity);
      if (Number.isNaN(quantity)) {
        throw new BadRequestException(`Invalid quantity at row ${index + 1}: ${record.quantity}`);
      }
      try {
        return ImportSalesHistoryItemSchema.parse({
          marketplace: record.marketplace,
          period: record.period,
          sku: record.sku,
          quantity,
        });
      } catch (error) {
        throw new BadRequestException(`Invalid data at row ${index + 1}: ${error}`);
      }
    });

    return this.salesHistoryService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
  }
}
