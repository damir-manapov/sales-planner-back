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
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import type { PaginatedResponse } from '@sales-planner/shared';
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
  parseCsvImport,
  sendCsvExport,
  sendJsonExport,
  type SkuImportResult,
  ZodValidationPipe,
} from '../../common/index.js';
import {
  type CreateSkuRequest,
  CreateSkuSchema,
  type ImportSkuItem,
  ImportSkuItemSchema,
  type PaginationQuery,
  PaginationQuerySchema,
  type UpdateSkuRequest,
  UpdateSkuSchema,
} from './skus.schema.js';
import { type Sku, SkusService } from './skus.service.js';

@Controller('skus')
@UseGuards(AuthGuard)
export class SkusController {
  constructor(private readonly skusService: SkusService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQuery,
  ): Promise<PaginatedResponse<Sku>> {
    return this.skusService.findByShopIdPaginated(ctx.shopId, query);
  }

  @Get('code/:code')
  @RequireReadAccess()
  async findByCode(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('code') code: string,
  ): Promise<Sku> {
    const sku = await this.skusService.findByCodeAndShop(code, ctx.shopId);
    if (!sku || sku.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`SKU with code ${code} not found`);
    }

    return sku;
  }

  @Get('export/json')
  @RequireReadAccess()
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.skusService.exportForShop(ctx.shopId);
    sendJsonExport(res, items, 'skus.json');
  }

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.skusService.exportForShop(ctx.shopId);
    sendCsvExport(res, items, 'skus.csv', [
      'code',
      'title',
      'category',
      'title2',
      'group',
      'supplier',
      'status',
    ]);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Sku> {
    const sku = await this.skusService.findById(id);
    assertShopAccess(sku, ctx, 'SKU', id);
    return sku;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(new ZodValidationPipe(CreateSkuSchema)) dto: CreateSkuRequest,
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
    @Body(new ZodValidationPipe(UpdateSkuSchema)) dto: UpdateSkuRequest,
  ): Promise<Sku> {
    const sku = await this.skusService.findById(id);
    assertShopAccess(sku, ctx, 'SKU', id);

    // update() returns undefined only if record doesn't exist, but we already verified it exists
    return (await this.skusService.update(id, dto))!;
  }

  @Post('import/json')
  @RequireWriteAccess()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    description: 'Upload JSON file or provide JSON array in body',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'JSON file with array of {code, title} objects',
            },
          },
        },
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              title: { type: 'string' },
            },
          },
        },
      ],
    },
  })
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() items?: ImportSkuItem[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SkuImportResult> {
    const validatedData = parseAndValidateImport(file, items, ImportSkuItemSchema);
    return this.skusService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
  }

  @Post('import/csv')
  @RequireWriteAccess()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'CSV file with columns: code, title, category (optional), group (optional), status (optional), supplier (optional)',
        },
      },
    },
  })
  async importCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SkuImportResult> {
    const records = parseCsvImport<{
      code: string;
      title: string;
      category?: string;
      group?: string;
      status?: string;
      supplier?: string;
    }>(file, undefined, ['code', 'title']);
    const items: ImportSkuItem[] = records.map((record) => ({
      code: record.code,
      title: record.title,
      category: record.category,
      group: record.group,
      status: record.status,
      supplier: record.supplier,
    }));
    return this.skusService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const sku = await this.skusService.findById(id);
    assertShopAccess(sku, ctx, 'SKU', id);

    await this.skusService.delete(id);
  }
}
