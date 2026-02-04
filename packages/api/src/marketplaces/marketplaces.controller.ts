import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  NotFoundException,
  Param,
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
import type { Response as ExpressResponse } from 'express';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import {
  RequireReadAccess,
  RequireWriteAccess,
  ShopContext,
  type ShopContext as ShopContextType,
} from '../auth/decorators.js';
import { parseAndValidateImport, ZodValidationPipe } from '../common/index.js';
import { fromCsv, normalizeId, toCsv } from '../lib/index.js';
import {
  type CreateMarketplaceRequest,
  CreateMarketplaceSchema,
  type ImportMarketplaceItem,
  ImportMarketplaceItemSchema,
  type UpdateMarketplaceRequest,
  UpdateMarketplaceSchema,
} from './marketplaces.schema.js';
import { type Marketplace, MarketplacesService } from './marketplaces.service.js';

interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

@Controller('marketplaces')
@UseGuards(AuthGuard)
export class MarketplacesController {
  constructor(private readonly marketplacesService: MarketplacesService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
  ): Promise<Marketplace[]> {
    return this.marketplacesService.findByShopId(ctx.shopId);
  }

  @Get('export/json')
  @RequireReadAccess()
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="marketplaces.json"')
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.marketplacesService.exportForShop(ctx.shopId);
    (res as unknown as { json: (body: unknown) => void }).json(items);
  }

  @Get('export/csv')
  @RequireReadAccess()
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="marketplaces.csv"')
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.marketplacesService.exportForShop(ctx.shopId);
    const csvContent = toCsv(items, ['id', 'title']);
    (res as unknown as { send: (body: string) => void }).send(csvContent);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id') id: string,
  ): Promise<Marketplace> {
    const normalizedId = normalizeId(id);
    const marketplace = await this.marketplacesService.findById(normalizedId, ctx.shopId);
    if (!marketplace) {
      throw new NotFoundException(`Marketplace with id ${id} not found`);
    }

    return marketplace;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(new ZodValidationPipe(CreateMarketplaceSchema)) dto: CreateMarketplaceRequest,
  ): Promise<Marketplace> {
    return this.marketplacesService.create({
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
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateMarketplaceSchema)) dto: UpdateMarketplaceRequest,
  ): Promise<Marketplace> {
    const normalizedId = normalizeId(id);
    const marketplace = await this.marketplacesService.update(normalizedId, ctx.shopId, dto);
    if (!marketplace) {
      throw new NotFoundException(`Marketplace with id ${id} not found`);
    }
    return marketplace;
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id') id: string,
  ): Promise<void> {
    const normalizedId = normalizeId(id);
    await this.marketplacesService.delete(normalizedId, ctx.shopId);
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
              description: 'JSON file with array of {id, title} objects',
            },
          },
        },
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
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
    @Body() items?: ImportMarketplaceItem[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const validatedData = parseAndValidateImport(file, items, ImportMarketplaceItemSchema);
    return this.marketplacesService.bulkUpsert(validatedData, ctx.shopId, ctx.tenantId);
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
          description: 'CSV file with columns: id, title',
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
    const records = fromCsv<{ id: string; title: string }>(content, ['id', 'title']);
    const items: ImportMarketplaceItem[] = records.map((record) => ({
      id: record.id,
      title: record.title,
    }));
    return this.marketplacesService.bulkUpsert(items, ctx.shopId, ctx.tenantId);
  }
}
