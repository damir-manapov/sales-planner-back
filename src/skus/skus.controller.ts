import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Header,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SkusService, CreateSkuDto, UpdateSkuDto, Sku } from './skus.service.js';
import { toCsv, fromCsv } from '../lib/index.js';
import {
  AuthGuard,
  AuthenticatedRequest,
  RequireReadAccess,
  RequireWriteAccess,
  ShopContext,
  type ShopContextType,
} from '../auth/index.js';

interface ImportSkuItem {
  code: string;
  title: string;
}

interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

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

  @Get('export/json')
  @RequireReadAccess()
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="skus.json"')
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: Response,
  ): Promise<void> {
    const items = await this.skusService.exportForShop(ctx.shopId);
    res.json(items);
  }

  @Get('export/csv')
  @RequireReadAccess()
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="skus.csv"')
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: Response,
  ): Promise<void> {
    const items = await this.skusService.exportForShop(ctx.shopId);
    const csvContent = toCsv(items, ['code', 'title']);
    res.send(csvContent);
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
    @Body() dto: Omit<CreateSkuDto, 'shop_id' | 'tenant_id'>,
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
    @Body() dto: UpdateSkuDto,
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
  ): Promise<ImportResult> {
    let data: ImportSkuItem[];

    if (file) {
      // File upload
      const content = file.buffer.toString('utf-8');
      data = JSON.parse(content) as ImportSkuItem[];
    } else if (items) {
      // JSON body
      data = items;
    } else {
      throw new BadRequestException('Either file or JSON body is required');
    }

    if (!Array.isArray(data)) {
      throw new BadRequestException('Data must be an array of SKU items');
    }

    for (const item of data) {
      if (!item.code || typeof item.code !== 'string') {
        throw new BadRequestException('Each item must have a "code" string field');
      }
      if (!item.title || typeof item.title !== 'string') {
        throw new BadRequestException('Each item must have a "title" string field');
      }
    }

    return this.skusService.bulkUpsert(data, ctx.shopId, ctx.tenantId);
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
          description: 'CSV file with columns: code, title',
        },
      },
    },
  })
  async importCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportResult> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const content = file.buffer.toString('utf-8');
    const records = fromCsv<{ code: string; title: string }>(content, ['code', 'title']);
    const items: ImportSkuItem[] = records.map((record) => ({
      code: record.code,
      title: record.title,
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
