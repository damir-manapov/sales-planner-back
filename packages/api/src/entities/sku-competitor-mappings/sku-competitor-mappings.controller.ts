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
  sendCsvExport,
  sendJsonExport,
  ZodValidationPipe,
} from '../../common/index.js';
import { fromCsv } from '../../lib/index.js';
import {
  type CreateSkuCompetitorMappingRequest,
  CreateSkuCompetitorMappingSchema,
  type ImportSkuCompetitorMappingItem,
  ImportSkuCompetitorMappingItemSchema,
  type SkuCompetitorMappingQuery,
  SkuCompetitorMappingQuerySchema,
  type UpdateSkuCompetitorMappingRequest,
  UpdateSkuCompetitorMappingSchema,
} from './sku-competitor-mappings.schema.js';
import {
  type SkuCompetitorMapping,
  SkuCompetitorMappingsService,
} from './sku-competitor-mappings.service.js';

@Controller('sku-competitor-mappings')
@UseGuards(AuthGuard)
export class SkuCompetitorMappingsController {
  constructor(private readonly skuCompetitorMappingsService: SkuCompetitorMappingsService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Query(new ZodValidationPipe(SkuCompetitorMappingQuerySchema)) query: SkuCompetitorMappingQuery,
  ): Promise<PaginatedResponse<SkuCompetitorMapping>> {
    return this.skuCompetitorMappingsService.findByShopIdPaginated(ctx.shopId, query);
  }

  @Get('export/json')
  @RequireReadAccess()
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.skuCompetitorMappingsService.exportCsv(ctx.shopId);
    sendJsonExport(res, items, 'sku-competitor-mappings.json');
  }

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.skuCompetitorMappingsService.exportCsv(ctx.shopId);
    sendCsvExport(res, items, 'sku-competitor-mappings.csv', [
      'sku',
      'marketplace',
      'marketplace_product_id',
    ]);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SkuCompetitorMapping> {
    const record = await this.skuCompetitorMappingsService.findById(id);
    assertShopAccess(record, ctx, 'SKU competitor mapping', id);
    return record;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(
      new ZodValidationPipe(
        CreateSkuCompetitorMappingSchema.omit({ shop_id: true, tenant_id: true }),
      ),
    )
    dto: CreateSkuCompetitorMappingRequest,
  ): Promise<SkuCompetitorMapping> {
    return this.skuCompetitorMappingsService.create({
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
    @Body(new ZodValidationPipe(UpdateSkuCompetitorMappingSchema))
    dto: UpdateSkuCompetitorMappingRequest,
  ): Promise<SkuCompetitorMapping> {
    const existing = await this.skuCompetitorMappingsService.findById(id);
    assertShopAccess(existing, ctx, 'SKU competitor mapping', id);
    return this.skuCompetitorMappingsService.update(id, dto);
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const existing = await this.skuCompetitorMappingsService.findById(id);
    assertShopAccess(existing, ctx, 'SKU competitor mapping', id);
    return this.skuCompetitorMappingsService.delete(id);
  }

  @Post('import/json')
  @RequireWriteAccess()
  @UseInterceptors(FileInterceptor('file'))
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() body?: ImportSkuCompetitorMappingItem[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const items = parseAndValidateImport<ImportSkuCompetitorMappingItem>(
      file,
      body,
      ImportSkuCompetitorMappingItemSchema,
    );
    return this.skuCompetitorMappingsService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
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
    const csv = file?.buffer?.toString('utf-8') ?? csvData;
    if (!csv) {
      throw new BadRequestException('No CSV data provided');
    }
    const records = fromCsv<{
      marketplace: string;
      marketplaceProductId: string;
      sku: string;
    }>(csv, ['marketplace', 'marketplaceProductId', 'sku']);
    const items: ImportSkuCompetitorMappingItem[] = records.map((r) => ({
      marketplace: r.marketplace,
      marketplaceProductId: r.marketplaceProductId,
      sku: r.sku,
    }));
    return this.skuCompetitorMappingsService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
}
