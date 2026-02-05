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
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard.js';
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
  type CreateBrandRequest,
  CreateBrandSchema,
  type ImportBrandItem,
  ImportBrandItemSchema,
  type UpdateBrandRequest,
  UpdateBrandSchema,
} from './brands.schema.js';
import { type Brand, BrandsService } from './brands.service.js';

@Controller('brands')
@UseGuards(AuthGuard)
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
  ): Promise<Brand[]> {
    return this.brandsService.findByShopId(ctx.shopId);
  }

  @Get('code/:code')
  @RequireReadAccess()
  async findByCode(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('code') code: string,
  ): Promise<Brand> {
    const brand = await this.brandsService.findByCodeAndShop(code, ctx.shopId);
    if (!brand || brand.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Brand with code ${code} not found`);
    }

    return brand;
  }

  @Get('export/json')
  @RequireReadAccess()
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.brandsService.exportForShop(ctx.shopId);
    sendJsonExport(res, items, 'brands.json');
  }

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.brandsService.exportForShop(ctx.shopId);
    sendCsvExport(res, items, 'brands.csv', ['code', 'title']);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Brand> {
    const brand = await this.brandsService.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand with id ${id} not found`);
    }

    if (brand.shop_id !== ctx.shopId || brand.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Brand with id ${id} not found in this shop/tenant`);
    }

    return brand;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(new ZodValidationPipe(CreateBrandSchema)) body: CreateBrandRequest,
  ): Promise<Brand> {
    return this.brandsService.create({
      ...body,
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
    @Body(new ZodValidationPipe(UpdateBrandSchema)) body: UpdateBrandRequest,
  ): Promise<Brand> {
    // Check brand exists and belongs to the user's shop/tenant
    const brand = await this.brandsService.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand with id ${id} not found`);
    }

    if (brand.shop_id !== ctx.shopId || brand.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Brand with id ${id} not found in this shop/tenant`);
    }

    const updated = await this.brandsService.update(id, body);
    if (!updated) {
      throw new NotFoundException(`Brand with id ${id} not found`);
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
    // Check brand exists and belongs to the user's shop/tenant
    const brand = await this.brandsService.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand with id ${id} not found`);
    }

    if (brand.shop_id !== ctx.shopId || brand.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Brand with id ${id} not found in this shop/tenant`);
    }

    await this.brandsService.delete(id);
    return { message: 'Brand deleted successfully' };
  }

  @Post('import/json')
  @RequireWriteAccess()
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() items?: ImportBrandItem[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const validatedData = parseAndValidateImport(file, items, ImportBrandItemSchema);
    return this.brandsService.bulkUpsert(validatedData, ctx.shopId, ctx.tenantId);
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
    const items: ImportBrandItem[] = records.map((record) => ({
      code: record.code,
      title: record.title,
    }));
    return this.brandsService.bulkUpsert(items, ctx.shopId, ctx.tenantId);
  }
}
