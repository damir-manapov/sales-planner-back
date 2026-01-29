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
} from '@nestjs/common';
import {
  SalesHistoryService,
  CreateSalesHistoryDto,
  UpdateSalesHistoryDto,
  SalesHistory,
  isValidPeriod,
} from './sales-history.service.js';
import {
  AuthGuard,
  AuthenticatedRequest,
  validateReadAccess,
  validateWriteAccess,
} from '../auth/index.js';

interface ImportSalesHistoryItem {
  sku_id: number;
  period: string; // "YYYY-MM"
  quantity: number;
  amount: string;
}

interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

@Controller('sales-history')
@UseGuards(AuthGuard)
export class SalesHistoryController {
  constructor(private readonly salesHistoryService: SalesHistoryService) {}

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Query('period_from') periodFrom?: string,
    @Query('period_to') periodTo?: string,
  ): Promise<SalesHistory[]> {
    validateReadAccess(req.user, shopId, tenantId);

    if (periodFrom && !isValidPeriod(periodFrom)) {
      throw new BadRequestException('period_from must be in YYYY-MM format');
    }
    if (periodTo && !isValidPeriod(periodTo)) {
      throw new BadRequestException('period_to must be in YYYY-MM format');
    }

    return this.salesHistoryService.findByShopAndPeriod(shopId, periodFrom, periodTo);
  }

  @Get(':id')
  async findById(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SalesHistory> {
    validateReadAccess(req.user, shopId, tenantId);

    const record = await this.salesHistoryService.findById(id);
    if (!record) {
      throw new NotFoundException(`Sales history record with id ${id} not found`);
    }

    if (record.shop_id !== shopId || record.tenant_id !== tenantId) {
      throw new NotFoundException(
        `Sales history record with id ${id} not found in this shop/tenant`,
      );
    }

    return record;
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Body() dto: Omit<CreateSalesHistoryDto, 'shop_id' | 'tenant_id'>,
  ): Promise<SalesHistory> {
    validateWriteAccess(req.user, shopId, tenantId);

    if (!isValidPeriod(dto.period)) {
      throw new BadRequestException('period must be in YYYY-MM format with valid month (01-12)');
    }

    return this.salesHistoryService.create({
      ...dto,
      shop_id: shopId,
      tenant_id: tenantId,
    });
  }

  @Put(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSalesHistoryDto,
  ): Promise<SalesHistory> {
    validateWriteAccess(req.user, shopId, tenantId);

    const existing = await this.salesHistoryService.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sales history record with id ${id} not found`);
    }

    if (existing.shop_id !== shopId || existing.tenant_id !== tenantId) {
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
  async delete(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    validateWriteAccess(req.user, shopId, tenantId);

    const existing = await this.salesHistoryService.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sales history record with id ${id} not found`);
    }

    if (existing.shop_id !== shopId || existing.tenant_id !== tenantId) {
      throw new NotFoundException(
        `Sales history record with id ${id} not found in this shop/tenant`,
      );
    }

    await this.salesHistoryService.delete(id);
  }

  @Post('import')
  async importJson(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Body() items: ImportSalesHistoryItem[],
  ): Promise<ImportResult> {
    validateWriteAccess(req.user, shopId, tenantId);

    if (!Array.isArray(items)) {
      throw new BadRequestException('Body must be an array of sales history items');
    }

    return this.salesHistoryService.bulkUpsert(items, shopId, tenantId);
  }
}
