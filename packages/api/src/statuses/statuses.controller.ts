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
  ): Promise<Status[]> {
    return this.statusesService.findByShopId(ctx.shopId);
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
    const brand = await this.statusesService.findById(id);
    if (!brand) {
      throw new NotFoundException(`Status with id ${id} not found`);
    }

    if (brand.shop_id !== ctx.shopId || brand.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Status with id ${id} not found in this shop/tenant`);
    }

    return brand;
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
    // Check brand exists and belongs to the user's shop/tenant
    const brand = await this.statusesService.findById(id);
    if (!brand) {
      throw new NotFoundException(`Status with id ${id} not found`);
    }

    if (brand.shop_id !== ctx.shopId || brand.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Status with id ${id} not found in this shop/tenant`);
    }

    const updated = await this.statusesService.update(id, body);
    if (!updated) {
      throw new NotFoundException(`Status with id ${id} not found`);
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
    const brand = await this.statusesService.findById(id);
    if (!brand) {
      throw new NotFoundException(`Status with id ${id} not found`);
    }

    if (brand.shop_id !== ctx.shopId || brand.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Status with id ${id} not found in this shop/tenant`);
    }

    await this.statusesService.delete(id);
    return { message: 'Status deleted successfully' };
  }

  @Post('import/json')
  @RequireWriteAccess()
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() items?: ImportStatusItem[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const validatedData = parseAndValidateImport(file, items, ImportStatusItemSchema);
    return this.statusesService.bulkUpsert(validatedData, ctx.shopId, ctx.tenantId);
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
    const items: ImportStatusItem[] = records.map((record) => ({
      code: record.code,
      title: record.title,
    }));
    return this.statusesService.bulkUpsert(items, ctx.shopId, ctx.tenantId);
  }
}
