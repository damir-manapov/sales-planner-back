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
  type CreateSeasonalCoefficientRequest,
  CreateSeasonalCoefficientSchema,
  type ImportSeasonalCoefficientItem,
  ImportSeasonalCoefficientItemSchema,
  type SeasonalCoefficientQuery,
  SeasonalCoefficientQuerySchema,
  type UpdateSeasonalCoefficientRequest,
  UpdateSeasonalCoefficientSchema,
} from './seasonal-coefficients.schema.js';
import {
  type SeasonalCoefficient,
  SeasonalCoefficientsService,
} from './seasonal-coefficients.service.js';

@Controller('seasonal-coefficients')
@UseGuards(AuthGuard)
export class SeasonalCoefficientsController {
  constructor(private readonly seasonalCoefficientsService: SeasonalCoefficientsService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Query(new ZodValidationPipe(SeasonalCoefficientQuerySchema)) query: SeasonalCoefficientQuery,
  ): Promise<PaginatedResponse<SeasonalCoefficient>> {
    return this.seasonalCoefficientsService.findByShopIdPaginated(ctx.shopId, query);
  }

  @Get('export/json')
  @RequireReadAccess()
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.seasonalCoefficientsService.exportCsv(ctx.shopId);
    sendJsonExport(res, items, 'seasonal-coefficients.json');
  }

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.seasonalCoefficientsService.exportCsv(ctx.shopId);
    sendCsvExport(res, items, 'seasonal-coefficients.csv', ['group', 'month', 'coefficient']);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SeasonalCoefficient> {
    const record = await this.seasonalCoefficientsService.findById(id);
    assertShopAccess(record, ctx, 'Seasonal coefficient', id);
    return record;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(
      new ZodValidationPipe(
        CreateSeasonalCoefficientSchema.omit({ shop_id: true, tenant_id: true }),
      ),
    )
    dto: CreateSeasonalCoefficientRequest,
  ): Promise<SeasonalCoefficient> {
    return this.seasonalCoefficientsService.create({
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
    @Body(new ZodValidationPipe(UpdateSeasonalCoefficientSchema))
    dto: UpdateSeasonalCoefficientRequest,
  ): Promise<SeasonalCoefficient> {
    const existing = await this.seasonalCoefficientsService.findById(id);
    assertShopAccess(existing, ctx, 'Seasonal coefficient', id);
    return this.seasonalCoefficientsService.update(id, dto);
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const existing = await this.seasonalCoefficientsService.findById(id);
    assertShopAccess(existing, ctx, 'Seasonal coefficient', id);
    return this.seasonalCoefficientsService.delete(id);
  }

  @Post('import/json')
  @RequireWriteAccess()
  @UseInterceptors(FileInterceptor('file'))
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() body?: ImportSeasonalCoefficientItem[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const duplicateKey = {
      keyExtractor: (item: ImportSeasonalCoefficientItem) => `${item.group}:${item.month}`,
      keyDescription: 'group+month',
    };
    const items = parseAndValidateImport<ImportSeasonalCoefficientItem>(
      file,
      body,
      ImportSeasonalCoefficientItemSchema,
      duplicateKey,
    );
    return this.seasonalCoefficientsService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
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
      keyExtractor: (item: ImportSeasonalCoefficientItem) => `${item.group}:${item.month}`,
      keyDescription: 'group+month',
    };
    const items = parseCsvAndValidateImport<ImportSeasonalCoefficientItem>(
      file,
      csvData,
      ['group', 'month', 'coefficient'],
      ImportSeasonalCoefficientItemSchema,
      duplicateKey,
    );
    return this.seasonalCoefficientsService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
}
