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
  parseCsvImport,
  type PaginationQuery,
  PaginationQuerySchema,
  sendCsvExport,
  sendJsonExport,
  ZodValidationPipe,
} from '../../common/index.js';
import {
  type CreateWarehouseRequest,
  CreateWarehouseSchema,
  type ImportWarehouseItem,
  ImportWarehouseItemSchema,
  type UpdateWarehouseRequest,
  UpdateWarehouseSchema,
} from './warehouses.schema.js';
import { type Warehouse, WarehousesService } from './warehouses.service.js';

@Controller('warehouses')
@UseGuards(AuthGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQuery,
  ): Promise<PaginatedResponse<Warehouse>> {
    return this.warehousesService.findByShopIdPaginated(ctx.shopId, query);
  }

  @Get('code/:code')
  @RequireReadAccess()
  async findByCode(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('code') code: string,
  ): Promise<Warehouse> {
    const warehouse = await this.warehousesService.findByCodeAndShop(code, ctx.shopId);
    if (!warehouse || warehouse.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Warehouse with code ${code} not found`);
    }

    return warehouse;
  }

  @Get('export/json')
  @RequireReadAccess()
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.warehousesService.exportForShop(ctx.shopId);
    sendJsonExport(res, items, 'warehouses.json');
  }

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.warehousesService.exportForShop(ctx.shopId);
    sendCsvExport(res, items, 'warehouses.csv', ['code', 'title']);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Warehouse> {
    const warehouse = await this.warehousesService.findById(id);
    assertShopAccess(warehouse, ctx, 'Warehouse', id);
    return warehouse;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(new ZodValidationPipe(CreateWarehouseSchema)) body: CreateWarehouseRequest,
  ): Promise<Warehouse> {
    return this.warehousesService.create({
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
    @Body(new ZodValidationPipe(UpdateWarehouseSchema)) body: UpdateWarehouseRequest,
  ): Promise<Warehouse> {
    const warehouse = await this.warehousesService.findById(id);
    assertShopAccess(warehouse, ctx, 'Warehouse', id);
    return this.warehousesService.update(id, body);
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const warehouse = await this.warehousesService.findById(id);
    assertShopAccess(warehouse, ctx, 'Warehouse', id);

    await this.warehousesService.delete(id);
  }

  @Post('import/json')
  @RequireWriteAccess()
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() items?: ImportWarehouseItem[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const validatedData = parseAndValidateImport(file, items, ImportWarehouseItemSchema);
    return this.warehousesService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
  }

  @Post('import/csv')
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
    const items: ImportWarehouseItem[] = records.map((record) => ({
      code: record.code,
      title: record.title,
    }));
    return this.warehousesService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
}
