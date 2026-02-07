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
  type CreateStatusRequest,
  CreateStatusSchema,
  type ImportStatusItem,
  ImportStatusItemSchema,
  type UpdateStatusRequest,
  UpdateStatusSchema,
} from './statuses.schema.js';
import { type Status, StatusesService } from './statuses.service.js';

@Controller('statuses')
@UseGuards(AuthGuard)
export class StatusesController {
  constructor(private readonly statusesService: StatusesService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQuery,
  ): Promise<PaginatedResponse<Status>> {
    return this.statusesService.findByShopIdPaginated(ctx.shopId, query);
  }

  @Get('code/:code')
  @RequireReadAccess()
  async findByCode(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('code') code: string,
  ): Promise<Status> {
    const status = await this.statusesService.findByCodeAndShop(code, ctx.shopId);
    if (!status || status.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Status with code ${code} not found`);
    }

    return status;
  }

  @Get('export/json')
  @RequireReadAccess()
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.statusesService.exportForShop(ctx.shopId);
    sendJsonExport(res, items, 'statuses.json');
  }

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.statusesService.exportForShop(ctx.shopId);
    sendCsvExport(res, items, 'statuses.csv', ['code', 'title']);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Status> {
    const status = await this.statusesService.findById(id);
    assertShopAccess(status, ctx, 'Status', id);
    return status;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(new ZodValidationPipe(CreateStatusSchema)) body: CreateStatusRequest,
  ): Promise<Status> {
    return this.statusesService.create({
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
    @Body(new ZodValidationPipe(UpdateStatusSchema)) body: UpdateStatusRequest,
  ): Promise<Status> {
    const status = await this.statusesService.findById(id);
    assertShopAccess(status, ctx, 'Status', id);
    return this.statusesService.update(id, body);
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const status = await this.statusesService.findById(id);
    assertShopAccess(status, ctx, 'Status', id);

    await this.statusesService.delete(id);
  }

  @Post('import/json')
  @RequireWriteAccess()
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() items?: ImportStatusItem[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const duplicateKey = {
      keyExtractor: (item: ImportStatusItem) => item.code,
      keyDescription: 'code',
    };
    const validatedData = parseAndValidateImport(file, items, ImportStatusItemSchema, duplicateKey);
    return this.statusesService.bulkUpsert(ctx.tenantId, ctx.shopId, validatedData);
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
      keyExtractor: (item: ImportStatusItem) => item.code,
      keyDescription: 'code',
    };
    const items = parseCsvAndValidateImport<ImportStatusItem>(
      file,
      csvData,
      ['code', 'title'],
      ImportStatusItemSchema,
      duplicateKey,
    );
    return this.statusesService.bulkUpsert(ctx.tenantId, ctx.shopId, items);
  }
}
