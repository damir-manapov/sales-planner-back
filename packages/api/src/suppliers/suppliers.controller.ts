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
  type CreateSupplierRequest,
  CreateSupplierSchema,
  type ImportSupplierItem,
  ImportSupplierItemSchema,
  type UpdateSupplierRequest,
  UpdateSupplierSchema,
} from './suppliers.schema.js';
import { type Supplier, SuppliersService } from './suppliers.service.js';

@Controller('suppliers')
@UseGuards(AuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
  ): Promise<Supplier[]> {
    return this.suppliersService.findByShopId(ctx.shopId);
  }

  @Get('code/:code')
  @RequireReadAccess()
  async findByCode(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('code') code: string,
  ): Promise<Supplier> {
    const supplier = await this.suppliersService.findByCodeAndShop(code, ctx.shopId);
    if (!supplier || supplier.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Supplier with code ${code} not found`);
    }

    return supplier;
  }

  @Get('export/json')
  @RequireReadAccess()
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.suppliersService.exportForShop(ctx.shopId);
    sendJsonExport(res, items, 'suppliers.json');
  }

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.suppliersService.exportForShop(ctx.shopId);
    sendCsvExport(res, items, 'suppliers.csv', ['code', 'title']);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Supplier> {
    const supplier = await this.suppliersService.findById(id);
    if (!supplier) {
      throw new NotFoundException(`Supplier with id ${id} not found`);
    }

    if (supplier.shop_id !== ctx.shopId || supplier.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Supplier with id ${id} not found in this shop/tenant`);
    }

    return supplier;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(new ZodValidationPipe(CreateSupplierSchema)) body: CreateSupplierRequest,
  ): Promise<Supplier> {
    return this.suppliersService.create({
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
    @Body(new ZodValidationPipe(UpdateSupplierSchema)) body: UpdateSupplierRequest,
  ): Promise<Supplier> {
    // Check supplier exists and belongs to the user's shop/tenant
    const supplier = await this.suppliersService.findById(id);
    if (!supplier) {
      throw new NotFoundException(`Supplier with id ${id} not found`);
    }

    if (supplier.shop_id !== ctx.shopId || supplier.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Supplier with id ${id} not found in this shop/tenant`);
    }

    const updated = await this.suppliersService.update(id, body);
    if (!updated) {
      throw new NotFoundException(`Supplier with id ${id} not found`);
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
    // Check supplier exists and belongs to the user's shop/tenant
    const supplier = await this.suppliersService.findById(id);
    if (!supplier) {
      throw new NotFoundException(`Supplier with id ${id} not found`);
    }

    if (supplier.shop_id !== ctx.shopId || supplier.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Supplier with id ${id} not found in this shop/tenant`);
    }

    await this.suppliersService.delete(id);
    return { message: 'Supplier deleted successfully' };
  }

  @Post('import/json')
  @RequireWriteAccess()
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() items?: unknown[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const validatedData = parseAndValidateImport(file, items, ImportSupplierItemSchema);
    return this.suppliersService.bulkUpsert(validatedData, ctx.shopId, ctx.tenantId);
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
    const items: ImportSupplierItem[] = records.map((record) => ({
      code: record.code,
      title: record.title,
    }));
    return this.suppliersService.bulkUpsert(items, ctx.shopId, ctx.tenantId);
  }
}
