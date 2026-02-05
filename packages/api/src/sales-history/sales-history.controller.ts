import {
  BadRequestException,
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
  parseAndValidateImport,
  sendCsvExport,
  sendJsonExport,
  ZodValidationPipe,
} from '../common/index.js';
import type { ImportResult } from '@sales-planner/shared';
import { fromCsv } from '../lib/index.js';
import {
  type CreateSalesHistoryRequest,
  CreateSalesHistorySchema,
  type ImportSalesHistoryItem,
  ImportSalesHistoryItemSchema,
  PeriodQuerySchema,
  type UpdateSalesHistoryRequest,
  UpdateSalesHistorySchema,
} from './sales-history.schema.js';
import { type SalesHistory, SalesHistoryService } from './sales-history.service.js';

@Controller('sales-history')
@UseGuards(AuthGuard)
export class SalesHistoryController {
  constructor(private readonly salesHistoryService: SalesHistoryService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Query('period_from') periodFrom?: string,
    @Query('period_to') periodTo?: string,
  ): Promise<SalesHistory[]> {
    // Validate query params
    PeriodQuerySchema.parse({ period_from: periodFrom, period_to: periodTo });
    return this.salesHistoryService.findByShopAndPeriod(ctx.shopId, periodFrom, periodTo);
  }

  @Get('export/json')
  @RequireReadAccess()
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
    @Query('period_from') periodFrom?: string,
    @Query('period_to') periodTo?: string,
  ): Promise<void> {
    // Validate query params
    PeriodQuerySchema.parse({ period_from: periodFrom, period_to: periodTo });
    const items = await this.salesHistoryService.exportForShop(ctx.shopId, periodFrom, periodTo);
    sendJsonExport(res, items, 'sales-history.json');
  }

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
    @Query('period_from') periodFrom?: string,
    @Query('period_to') periodTo?: string,
  ): Promise<void> {
    // Validate query params
    PeriodQuerySchema.parse({ period_from: periodFrom, period_to: periodTo });
    const items = await this.salesHistoryService.exportForShop(ctx.shopId, periodFrom, periodTo);
    sendCsvExport(res, items, 'sales-history.csv', [
      'sku_code',
      'period',
      'quantity',
      'marketplace',
    ]);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SalesHistory> {
    const record = await this.salesHistoryService.findById(id);
    if (!record) {
      throw new NotFoundException(`Sales history record with id ${id} not found`);
    }

    if (record.shop_id !== ctx.shopId || record.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(
        `Sales history record with id ${id} not found in this shop/tenant`,
      );
    }

    return record;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(new ZodValidationPipe(CreateSalesHistorySchema.omit({ shop_id: true, tenant_id: true })))
    dto: CreateSalesHistoryRequest,
  ): Promise<SalesHistory> {
    return this.salesHistoryService.create({
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
    @Body(new ZodValidationPipe(UpdateSalesHistorySchema)) dto: UpdateSalesHistoryRequest,
  ): Promise<SalesHistory> {
    const existing = await this.salesHistoryService.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sales history record with id ${id} not found`);
    }

    if (existing.shop_id !== ctx.shopId || existing.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(
        `Sales history record with id ${id} not found in this shop/tenant`,
      );
    }

    const updated = await this.salesHistoryService.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Sales history record with id ${id} not found`);
    }
    return updated;
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const existing = await this.salesHistoryService.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sales history record with id ${id} not found`);
    }

    if (existing.shop_id !== ctx.shopId || existing.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(
        `Sales history record with id ${id} not found in this shop/tenant`,
      );
    }

    await this.salesHistoryService.delete(id);
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
              description: 'JSON file with array of {sku_code, period, quantity} objects',
            },
          },
        },
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sku_code: { type: 'string' },
              period: { type: 'string' },
              quantity: { type: 'number' },
            },
          },
        },
      ],
    },
  })
  async import(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() items?: ImportSalesHistoryItem[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const validatedData = parseAndValidateImport(file, items, ImportSalesHistoryItemSchema);
    return this.salesHistoryService.bulkUpsert(validatedData, ctx.shopId, ctx.tenantId);
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
          description: 'CSV file with columns: sku_code, period, quantity, marketplace',
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
    const records = fromCsv<{
      sku_code: string;
      period: string;
      quantity: string;
      marketplace: string;
    }>(content, ['sku_code', 'period', 'quantity', 'marketplace']);

    // Validate and transform each record with Zod
    const validatedData = records.map((record, index) => {
      const quantity = Number.parseFloat(record.quantity);
      if (Number.isNaN(quantity)) {
        throw new BadRequestException(`Invalid quantity at row ${index + 1}: ${record.quantity}`);
      }
      try {
        return ImportSalesHistoryItemSchema.parse({
          sku_code: record.sku_code,
          period: record.period,
          quantity,
          marketplace: record.marketplace,
        });
      } catch (error) {
        throw new BadRequestException(`Invalid data at row ${index + 1}: ${error}`);
      }
    });

    return this.salesHistoryService.bulkUpsert(validatedData, ctx.shopId, ctx.tenantId);
  }
}
