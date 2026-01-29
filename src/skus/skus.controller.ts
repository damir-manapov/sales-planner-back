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
import { SkusService, CreateSkuDto, UpdateSkuDto, Sku } from './skus.service.js';
import {
  AuthGuard,
  AuthenticatedRequest,
  validateReadAccess,
  validateWriteAccess,
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
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
  ): Promise<Sku[]> {
    validateReadAccess(req.user, shopId, tenantId);
    return this.skusService.findByShopId(shopId);
  }

  @Get(':id')
  async findById(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Sku> {
    validateReadAccess(req.user, shopId, tenantId);

    const sku = await this.skusService.findById(id);
    if (!sku) {
      throw new NotFoundException(`SKU with id ${id} not found`);
    }

    if (sku.shop_id !== shopId || sku.tenant_id !== tenantId) {
      throw new NotFoundException(`SKU with id ${id} not found in this shop/tenant`);
    }

    return sku;
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Body() dto: Omit<CreateSkuDto, 'shop_id' | 'tenant_id'>,
  ): Promise<Sku> {
    validateWriteAccess(req.user, shopId, tenantId);
    return this.skusService.create({
      ...dto,
      shop_id: shopId,
      tenant_id: tenantId,
    });
  }

  @Put(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSkuDto,
  ): Promise<Sku> {
    validateWriteAccess(req.user, shopId, tenantId);

    const existing = await this.skusService.findById(id);
    if (!existing) {
      throw new NotFoundException(`SKU with id ${id} not found`);
    }

    if (existing.shop_id !== shopId || existing.tenant_id !== tenantId) {
      throw new NotFoundException(`SKU with id ${id} not found in this shop/tenant`);
    }

    const sku = await this.skusService.update(id, dto);
    if (!sku) {
      throw new NotFoundException(`SKU with id ${id} not found`);
    }
    return sku;
  }

  @Post('import/json')
  async importJson(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Body() items: ImportSkuItem[],
  ): Promise<ImportResult> {
    validateWriteAccess(req.user, shopId, tenantId);

    if (!Array.isArray(items)) {
      throw new BadRequestException('Body must be an array of SKU items');
    }

    for (const item of items) {
      if (!item.code || typeof item.code !== 'string') {
        throw new BadRequestException('Each item must have a "code" string field');
      }
      if (!item.title || typeof item.title !== 'string') {
        throw new BadRequestException('Each item must have a "title" string field');
      }
    }

    return this.skusService.bulkUpsert(items, shopId, tenantId);
  }

  @Post('import/csv')
  async importCsv(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Body() body: { content: string },
  ): Promise<ImportResult> {
    validateWriteAccess(req.user, shopId, tenantId);

    if (!body.content || typeof body.content !== 'string') {
      throw new BadRequestException('Body must contain a "content" string field with CSV data');
    }

    try {
      const records = parse(body.content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Array<Record<string, string>>;

      const items: ImportSkuItem[] = records.map((record) => {
        if (!record.code) {
          throw new BadRequestException('CSV must have a "code" column');
        }
        if (!record.title) {
          throw new BadRequestException('CSV must have a "title" column');
        }
        return {
          code: record.code,
          title: record.title,
        };
      });

      return this.skusService.bulkUpsert(items, shopId, tenantId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Delete(':id')
  async delete(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    validateWriteAccess(req.user, shopId, tenantId);

    const existing = await this.skusService.findById(id);
    if (!existing) {
      throw new NotFoundException(`SKU with id ${id} not found`);
    }

    if (existing.shop_id !== shopId || existing.tenant_id !== tenantId) {
      throw new NotFoundException(`SKU with id ${id} not found in this shop/tenant`);
    }

    await this.skusService.delete(id);
  }
}
