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
  type ImportResult,
  parseAndValidateImport,
  parseCsvImport,
  sendCsvExport,
  sendJsonExport,
  ZodValidationPipe,
} from '../common/index.js';
import {
  type CreateCategoryRequest,
  CreateCategorySchema,
  type ImportCategoryItem,
  ImportCategoryItemSchema,
  type UpdateCategoryRequest,
  UpdateCategorySchema,
} from './categories.schema.js';
import { type Category, CategoriesService } from './categories.service.js';

@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
  ): Promise<Category[]> {
    return this.categoriesService.findByShopId(ctx.shopId);
  }

  @Get('code/:code')
  @RequireReadAccess()
  async findByCode(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('code') code: string,
  ): Promise<Category> {
    const category = await this.categoriesService.findByCodeAndShop(code, ctx.shopId);
    if (!category || category.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Category with code ${code} not found`);
    }

    return category;
  }

  @Get('export/json')
  @RequireReadAccess()
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.categoriesService.exportForShop(ctx.shopId);
    sendJsonExport(res, items, 'categories.json');
  }

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.categoriesService.exportForShop(ctx.shopId);
    sendCsvExport(res, items, 'categories.csv', ['code', 'title']);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Category> {
    const brand = await this.categoriesService.findById(id);
    if (!brand) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    if (brand.shop_id !== ctx.shopId || brand.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Category with id ${id} not found in this shop/tenant`);
    }

    return brand;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(new ZodValidationPipe(CreateCategorySchema)) body: CreateCategoryRequest,
  ): Promise<Category> {
    return this.categoriesService.create({
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
    @Body(new ZodValidationPipe(UpdateCategorySchema)) body: UpdateCategoryRequest,
  ): Promise<Category> {
    // Check brand exists and belongs to the user's shop/tenant
    const brand = await this.categoriesService.findById(id);
    if (!brand) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    if (brand.shop_id !== ctx.shopId || brand.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Category with id ${id} not found in this shop/tenant`);
    }

    const updated = await this.categoriesService.update(id, body);
    if (!updated) {
      throw new NotFoundException(`Category with id ${id} not found`);
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
    const brand = await this.categoriesService.findById(id);
    if (!brand) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    if (brand.shop_id !== ctx.shopId || brand.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Category with id ${id} not found in this shop/tenant`);
    }

    await this.categoriesService.delete(id);
    return { message: 'Category deleted successfully' };
  }

  @Post('import/json')
  @RequireWriteAccess()
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() items?: ImportCategoryItem[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const validatedData = parseAndValidateImport(file, items, ImportCategoryItemSchema);
    return this.categoriesService.bulkUpsert(validatedData, ctx.shopId, ctx.tenantId);
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
    const items: ImportCategoryItem[] = records.map((record) => ({
      code: record.code,
      title: record.title,
    }));
    return this.categoriesService.bulkUpsert(items, ctx.shopId, ctx.tenantId);
  }
}
