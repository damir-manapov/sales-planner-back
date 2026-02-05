import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard.js';
import {
  RequireReadAccess,
  RequireWriteAccess,
  ShopContext,
  type ShopContext as ShopContextType,
} from '../auth/decorators.js';
import {
  type ExpressResponse,
  parseAndValidateImport,
  parseCsvImport,
  sendCsvExport,
  sendJsonExport,
  ZodValidationPipe,
  type SkuImportResult,
} from '../common/index.js';
import {
  type CreateSkuRequest,
  CreateSkuSchema,
  type ImportSkuItem,
  ImportSkuItemSchema,
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
  ): Promise<Sku[]> {
    return this.skusService.findByShopId(ctx.shopId);
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
    return this.skusService.bulkUpsert(validatedData, ctx.shopId, ctx.tenantId);
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
