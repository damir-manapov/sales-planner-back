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
  type CompetitorProductQuery,
  CompetitorProductQuerySchema,
  type CreateCompetitorProductRequest,
  CreateCompetitorProductSchema,
  type ImportCompetitorProductItem,
  ImportCompetitorProductItemSchema,
  type UpdateCompetitorProductRequest,
  UpdateCompetitorProductSchema,
} from './competitor-products.schema.js';
import {
  type CompetitorProduct,
  CompetitorProductsService,
} from './competitor-products.service.js';

@Controller('competitor-products')
@UseGuards(AuthGuard)
export class CompetitorProductsController {
  constructor(private readonly competitorProductsService: CompetitorProductsService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Query(new ZodValidationPipe(CompetitorProductQuerySchema)) query: CompetitorProductQuery,
  ): Promise<PaginatedResponse<CompetitorProduct>> {
    return this.competitorProductsService.findByShopIdPaginated(ctx.shopId, query);
  }

  @Get('export/json')
  @RequireReadAccess()
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.competitorProductsService.exportCsv(ctx.shopId);
    sendJsonExport(res, items, 'competitor-products.json');
  }

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.competitorProductsService.exportCsv(ctx.shopId);
    sendCsvExport(res, items, 'competitor-products.csv', [
      'marketplace',
      'marketplace_product_id',
      'title',
      'brand',
    ]);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CompetitorProduct> {
    const record = await this.competitorProductsService.findById(id);
    assertShopAccess(record, ctx, 'Competitor Product', id);
    return record;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(
      new ZodValidationPipe(CreateCompetitorProductSchema.omit({ shop_id: true, tenant_id: true })),
    )
    dto: CreateCompetitorProductRequest,
  ): Promise<CompetitorProduct> {
    return this.competitorProductsService.create({
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
    @Body(new ZodValidationPipe(UpdateCompetitorProductSchema)) dto: UpdateCompetitorProductRequest,
  ): Promise<CompetitorProduct> {
    const existing = await this.competitorProductsService.findById(id);
    assertShopAccess(existing, ctx, 'Competitor Product', id);
    return this.competitorProductsService.update(id, dto);
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const existing = await this.competitorProductsService.findById(id);
    assertShopAccess(existing, ctx, 'Competitor Product', id);
    return this.competitorProductsService.delete(id);
  }

  @Post('import/json')
  @RequireWriteAccess()
  @UseInterceptors(FileInterceptor('file'))
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() body?: ImportCompetitorProductItem[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const duplicateKey = {
      keyExtractor: (item: ImportCompetitorProductItem) =>
        `${item.marketplace}:${item.marketplaceProductId}`,
      keyDescription: 'marketplace+marketplaceProductId',
    };
    const items = parseAndValidateImport<ImportCompetitorProductItem>(
      file,
      body,
      ImportCompetitorProductItemSchema,
      duplicateKey,
    );
    return this.competitorProductsService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
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
      keyExtractor: (item: ImportCompetitorProductItem) =>
        `${item.marketplace}:${item.marketplaceProductId}`,
      keyDescription: 'marketplace+marketplaceProductId',
    };
    const items = parseCsvAndValidateImport<ImportCompetitorProductItem>(
      file,
      csvData,
      ['marketplace', 'marketplaceProductId'],
      ImportCompetitorProductItemSchema,
      duplicateKey,
    );
    return this.competitorProductsService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
}
