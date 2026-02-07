import {
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
import type { ImportResult, PaginatedResponse } from '@sales-planner/shared';
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
  parseCsvAndValidateImport,
  sendCsvExport,
  sendJsonExport,
  ZodValidationPipe,
} from '../../common/index.js';
import {
  type CompetitorSaleQuery,
  CompetitorSaleQuerySchema,
  type CreateCompetitorSaleRequest,
  CreateCompetitorSaleSchema,
  type ImportCompetitorSaleItem,
  ImportCompetitorSaleItemSchema,
  PeriodQuerySchema,
  type UpdateCompetitorSaleRequest,
  UpdateCompetitorSaleSchema,
} from './competitor-sales.schema.js';
import { type CompetitorSale, CompetitorSalesService } from './competitor-sales.service.js';

@Controller('competitor-sales')
@UseGuards(AuthGuard)
export class CompetitorSalesController {
  constructor(private readonly competitorSalesService: CompetitorSalesService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Query(new ZodValidationPipe(CompetitorSaleQuerySchema)) query: CompetitorSaleQuery,
  ): Promise<PaginatedResponse<CompetitorSale>> {
    return this.competitorSalesService.findByShopAndPeriod(ctx.shopId, query);
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
    PeriodQuerySchema.parse({ period_from: periodFrom, period_to: periodTo });
    const items = await this.competitorSalesService.exportForShop(ctx.shopId, periodFrom, periodTo);
    sendJsonExport(res, items, 'competitor-sales.json');
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
    PeriodQuerySchema.parse({ period_from: periodFrom, period_to: periodTo });
    const items = await this.competitorSalesService.exportForShop(ctx.shopId, periodFrom, periodTo);
    sendCsvExport(res, items, 'competitor-sales.csv', [
      'marketplace',
      'marketplace_product_id',
      'period',
      'quantity',
    ]);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CompetitorSale> {
    const record = await this.competitorSalesService.findById(id);
    assertShopAccess(record, ctx, 'Competitor sale', id);
    return record;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(
      new ZodValidationPipe(CreateCompetitorSaleSchema.omit({ shop_id: true, tenant_id: true })),
    )
    dto: CreateCompetitorSaleRequest,
  ): Promise<CompetitorSale> {
    return this.competitorSalesService.create({
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
    @Body(new ZodValidationPipe(UpdateCompetitorSaleSchema)) dto: UpdateCompetitorSaleRequest,
  ): Promise<CompetitorSale> {
    const existing = await this.competitorSalesService.findById(id);
    assertShopAccess(existing, ctx, 'Competitor sale', id);
    return this.competitorSalesService.update(id, dto);
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const existing = await this.competitorSalesService.findById(id);
    assertShopAccess(existing, ctx, 'Competitor sale', id);
    return this.competitorSalesService.delete(id);
  }

  @Post('import/json')
  @RequireWriteAccess()
  @UseInterceptors(FileInterceptor('file'))
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() body?: ImportCompetitorSaleItem[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const duplicateKey = {
      keyExtractor: (item: ImportCompetitorSaleItem) =>
        `${item.marketplace}:${item.marketplaceProductId}:${item.period}`,
      keyDescription: 'marketplace+marketplaceProductId+period',
    };
    const items = parseAndValidateImport<ImportCompetitorSaleItem>(
      file,
      body,
      ImportCompetitorSaleItemSchema,
      duplicateKey,
    );
    return this.competitorSalesService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }

  @Post('import/csv')
  @RequireWriteAccess()
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @UploadedFile() file?: Express.Multer.File,
    @Body('data') csvData?: string,
  ): Promise<ImportResult> {
    const duplicateKey = {
      keyExtractor: (item: ImportCompetitorSaleItem) =>
        `${item.marketplace}:${item.marketplaceProductId}:${item.period}`,
      keyDescription: 'marketplace+marketplaceProductId+period',
    };
    const items = parseCsvAndValidateImport<ImportCompetitorSaleItem>(
      file,
      csvData,
      ['marketplace', 'marketplaceProductId', 'period', 'quantity'],
      ImportCompetitorSaleItemSchema,
      duplicateKey,
    );
    return this.competitorSalesService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
}
