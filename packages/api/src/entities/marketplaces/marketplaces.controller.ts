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
import type { AuthenticatedRequest } from '../../auth/auth.guard.js';
import { AuthGuard } from '../../auth/auth.guard.js';
import {
  RequireReadAccess,
  RequireWriteAccess,
  ShopContext,
  type ShopContext as ShopContextType,
} from '../../auth/decorators.js';
import type { ImportResult } from '@sales-planner/shared';
import {
  assertShopAccess,
  type ExpressResponse,
  parseAndValidateImport,
  parseCsvImport,
  sendCsvExport,
  sendJsonExport,
  ZodValidationPipe,
} from '../../common/index.js';
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

  @Get('code/:code')
  @RequireReadAccess()
  async findByCode(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('code') code: string,
  ): Promise<Marketplace> {
    const marketplace = await this.marketplacesService.findByCodeAndShop(code, ctx.shopId);
    if (!marketplace || marketplace.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Marketplace with code ${code} not found`);
    }

    return marketplace;
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
    assertShopAccess(marketplace, ctx, 'Marketplace', id);
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
    const marketplace = await this.marketplacesService.findById(id);
    assertShopAccess(marketplace, ctx, 'Marketplace', id);

    // update() returns undefined only if record doesn't exist, but we already verified it exists
    return (await this.marketplacesService.update(id, dto))!;
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const marketplace = await this.marketplacesService.findById(id);
    assertShopAccess(marketplace, ctx, 'Marketplace', id);

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
    return this.marketplacesService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
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
    return this.marketplacesService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
}
