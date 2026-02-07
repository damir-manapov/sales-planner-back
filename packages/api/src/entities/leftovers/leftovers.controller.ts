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
  type CreateLeftoverRequest,
  CreateLeftoverSchema,
  type ImportLeftoverItem,
  ImportLeftoverItemSchema,
  type LeftoverQuery,
  LeftoverQuerySchema,
  type UpdateLeftoverRequest,
  UpdateLeftoverSchema,
} from './leftovers.schema.js';
import { type Leftover, LeftoversService } from './leftovers.service.js';

@Controller('leftovers')
@UseGuards(AuthGuard)
export class LeftoversController {
  constructor(private readonly leftoversService: LeftoversService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Query(new ZodValidationPipe(LeftoverQuerySchema)) query: LeftoverQuery,
  ): Promise<PaginatedResponse<Leftover>> {
    return this.leftoversService.findByShopAndPeriod(ctx.shopId, query);
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
    const items = await this.leftoversService.exportForShop(ctx.shopId, periodFrom, periodTo);
    sendJsonExport(res, items, 'leftovers.json');
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
    const items = await this.leftoversService.exportForShop(ctx.shopId, periodFrom, periodTo);
    sendCsvExport(res, items, 'leftovers.csv', ['warehouse', 'sku', 'period', 'quantity']);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Leftover> {
    const record = await this.leftoversService.findById(id);
    assertShopAccess(record, ctx, 'Leftover', id);
    return record;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(new ZodValidationPipe(CreateLeftoverSchema.omit({ shop_id: true, tenant_id: true })))
    dto: CreateLeftoverRequest,
  ): Promise<Leftover> {
    return this.leftoversService.create({
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
    @Body(new ZodValidationPipe(UpdateLeftoverSchema)) dto: UpdateLeftoverRequest,
  ): Promise<Leftover> {
    const existing = await this.leftoversService.findById(id);
    assertShopAccess(existing, ctx, 'Leftover', id);
    return this.leftoversService.update(id, dto);
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const existing = await this.leftoversService.findById(id);
    assertShopAccess(existing, ctx, 'Leftover', id);
    return this.leftoversService.delete(id);
  }

  @Post('import/json')
  @RequireWriteAccess()
  @UseInterceptors(FileInterceptor('file'))
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() body?: ImportLeftoverItem[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const items = parseAndValidateImport<ImportLeftoverItem>(file, body, ImportLeftoverItemSchema);
    return this.leftoversService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
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
      warehouse: string;
      sku: string;
      period: string;
      quantity: string;
    }>(csv, ['warehouse', 'sku', 'period', 'quantity']);

    const items = records.map((record, index) => {
      const quantity = Number.parseFloat(record.quantity);
      if (Number.isNaN(quantity)) {
        throw new BadRequestException(`Invalid quantity at row ${index + 1}: ${record.quantity}`);
      }
      return ImportLeftoverItemSchema.parse({
        warehouse: record.warehouse,
        sku: record.sku,
        period: record.period,
        quantity,
      });
    });
    return this.leftoversService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
}
