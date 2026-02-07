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
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest, AuthGuard } from '../../auth/auth.guard.js';
import {
  RequireReadAccess,
  RequireWriteAccess,
  ShopContext,
  type ShopContext as ShopContextType,
} from '../../auth/decorators.js';
import type { ImportResult, PaginatedResponse } from '@sales-planner/shared';
import {
  assertShopAccess,
  type ExpressResponse,
  parseAndValidateImport,
  parseCsvAndValidateImport,
  type PaginationQuery,
  PaginationQuerySchema,
  sendCsvExport,
  sendJsonExport,
  ZodValidationPipe,
} from '../../common/index.js';
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
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQuery,
  ): Promise<PaginatedResponse<Supplier>> {
    return this.suppliersService.findByShopIdPaginated(ctx.shopId, query);
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
    assertShopAccess(supplier, ctx, 'Supplier', id);
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
    const supplier = await this.suppliersService.findById(id);
    assertShopAccess(supplier, ctx, 'Supplier', id);
    return this.suppliersService.update(id, body);
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const supplier = await this.suppliersService.findById(id);
    assertShopAccess(supplier, ctx, 'Supplier', id);

    await this.suppliersService.delete(id);
  }

  @Post('import/json')
  @RequireWriteAccess()
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() items?: unknown[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const duplicateKey = {
      keyExtractor: (item: ImportSupplierItem) => item.code,
      keyDescription: 'code',
    };
    const validatedData = parseAndValidateImport(
      file,
      items,
      ImportSupplierItemSchema,
      duplicateKey,
    );
    return this.suppliersService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
  }

  @Post('import/csv')
  @RequireWriteAccess()
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @UploadedFile() file?: Express.Multer.File,
    @Body('data') csvData?: string,
  ): Promise<ImportResult> {
    const duplicateKey = {
      keyExtractor: (item: ImportSupplierItem) => item.code,
      keyDescription: 'code',
    };
    const items = parseCsvAndValidateImport<ImportSupplierItem>(
      file,
      csvData,
      ['code', 'title'],
      ImportSupplierItemSchema,
      duplicateKey,
    );
    return this.suppliersService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
}
