import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Header,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import {
  SalesHistoryService,
  CreateSalesHistoryDto,
  UpdateSalesHistoryDto,
  SalesHistory,
} from './sales-history.service.js';
import { isValidPeriod, toCsv, fromCsv } from '../lib/index.js';
import {
  AuthGuard,
  AuthenticatedRequest,
  RequireReadAccess,
  RequireWriteAccess,
  ShopContext,
  type ShopContextType,
} from '../auth/index.js';

interface ImportSalesHistoryItem {
  sku_code: string;
  period: string; // "YYYY-MM"
  quantity: number;
}

interface ImportResult {
  created: number;
  updated: number;
  skus_created: number;
  errors: string[];
}

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
    if (periodFrom && !isValidPeriod(periodFrom)) {
      throw new BadRequestException('period_from must be in YYYY-MM format');
    }
    if (periodTo && !isValidPeriod(periodTo)) {
      throw new BadRequestException('period_to must be in YYYY-MM format');
    }

    return this.salesHistoryService.findByShopAndPeriod(ctx.shopId, periodFrom, periodTo);
  }

  @Get('export/json')
  @RequireReadAccess()
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="sales-history.json"')
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: Response,
    @Query('period_from') periodFrom?: string,
    @Query('period_to') periodTo?: string,
  ): Promise<void> {
    if (periodFrom && !isValidPeriod(periodFrom)) {
      throw new BadRequestException('period_from must be in YYYY-MM format');
    }
    if (periodTo && !isValidPeriod(periodTo)) {
      throw new BadRequestException('period_to must be in YYYY-MM format');
    }

    const items = await this.salesHistoryService.exportForShop(ctx.shopId, periodFrom, periodTo);
    res.json(items);
  }

  @Get('export/csv')
  @RequireReadAccess()
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="sales-history.csv"')
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: Response,
    @Query('period_from') periodFrom?: string,
    @Query('period_to') periodTo?: string,
  ): Promise<void> {
    if (periodFrom && !isValidPeriod(periodFrom)) {
      throw new BadRequestException('period_from must be in YYYY-MM format');
    }
    if (periodTo && !isValidPeriod(periodTo)) {
      throw new BadRequestException('period_to must be in YYYY-MM format');
    }

    const items = await this.salesHistoryService.exportForShop(ctx.shopId, periodFrom, periodTo);
    const csvContent = toCsv(items, ['sku_code', 'period', 'quantity']);
    res.send(csvContent);
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
    @Body() dto: Omit<CreateSalesHistoryDto, 'shop_id' | 'tenant_id'>,
  ): Promise<SalesHistory> {
    if (!isValidPeriod(dto.period)) {
      throw new BadRequestException('period must be in YYYY-MM format with valid month (01-12)');
    }

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
    @Body() dto: UpdateSalesHistoryDto,
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

  @Post('import')
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
    let data: ImportSalesHistoryItem[];

    if (file) {
      // File upload
      const content = file.buffer.toString('utf-8');
      data = JSON.parse(content) as ImportSalesHistoryItem[];
    } else if (items) {
      // JSON body
      data = items;
    } else {
      throw new BadRequestException('Either file or JSON body is required');
    }

    if (!Array.isArray(data)) {
      throw new BadRequestException('Data must be an array of sales history items');
    }

    return this.salesHistoryService.bulkUpsert(data, ctx.shopId, ctx.tenantId);
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
          description: 'CSV file with columns: sku_code, period, quantity',
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
    const records = fromCsv<{ sku_code: string; period: string; quantity: string }>(content, [
      'sku_code',
      'period',
      'quantity',
    ]);

    const items: ImportSalesHistoryItem[] = records.map((record) => {
      const quantity = Number.parseFloat(record.quantity);
      if (Number.isNaN(quantity)) {
        throw new BadRequestException(`Invalid quantity value: ${record.quantity}`);
      }
      return {
        sku_code: record.sku_code,
        period: record.period,
        quantity,
      };
    });

    return this.salesHistoryService.bulkUpsert(items, ctx.shopId, ctx.tenantId);
  }
}
