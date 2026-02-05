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
import type { Response as ExpressResponse } from 'express';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import {
  RequireReadAccess,
  RequireWriteAccess,
  ShopContext,
  type ShopContext as ShopContextType,
} from '../auth/decorators.js';
import {
  type ImportResult,
  parseAndValidateImport,
  parseCsvImport,
  sendCsvExport,
  sendJsonExport,
  ZodValidationPipe,
} from '../common/index.js';
import {
  type CreateMarketplaceRequest,
  CreateMarketplaceSchema,
  type ImportMarketplaceItem,
  ImportMarketplaceItemSchema,
  type UpdateMarketplaceRequest,
  UpdateMarketplaceSchema,
} from './marketplaces.schema.js';
import { type Marketplace, MarketplacesService } from './marketplaces.service.js';

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
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.marketplacesService.exportForShop(ctx.shopId);
    sendJsonExport(res, items, 'marketplaces.json');
  }

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.marketplacesService.exportForShop(ctx.shopId);
    sendCsvExport(res, items, 'marketplaces.csv', ['code', 'title']);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Marketplace> {
    const marketplace = await this.marketplacesService.findById(id);
    if (!marketplace) {
      throw new NotFoundException(`Marketplace with id ${id} not found`);
    }

    if (marketplace.shop_id !== ctx.shopId || marketplace.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Marketplace with id ${id} not found in this shop/tenant`);
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
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateMarketplaceSchema)) dto: UpdateMarketplaceRequest,
  ): Promise<Marketplace> {
    // Check marketplace exists and belongs to the user's shop/tenant
    const marketplace = await this.marketplacesService.findById(id);
    if (!marketplace) {
      throw new NotFoundException(`Marketplace with id ${id} not found`);
    }

    if (marketplace.shop_id !== ctx.shopId || marketplace.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Marketplace with id ${id} not found in this shop/tenant`);
    }

    const updated = await this.marketplacesService.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Marketplace with id ${id} not found`);
    }

    return updated;
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    // Check marketplace exists and belongs to the user's shop/tenant
    const marketplace = await this.marketplacesService.findById(id);
    if (!marketplace) {
      throw new NotFoundException(`Marketplace with id ${id} not found`);
    }

    if (marketplace.shop_id !== ctx.shopId || marketplace.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Marketplace with id ${id} not found in this shop/tenant`);
    }

    await this.marketplacesService.delete(id);
    return { message: 'Marketplace deleted successfully' };
  }

  @Post('import/json')
  @RequireWriteAccess()
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @RequireWriteAccess()
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const records = parseCsvImport<{ code: string; title: string }>(file, undefined, [
      'code',
      'title',
    ]);
    const items: ImportMarketplaceItem[] = records.map((record) => ({
      code: record.code,
      title: record.title,
    }));
    return this.marketplacesService.bulkUpsert(items, ctx.shopId, ctx.tenantId);
  }
}
