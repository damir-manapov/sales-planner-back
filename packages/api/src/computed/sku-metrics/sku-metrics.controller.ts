import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedRequest, AuthGuard } from '../../auth/auth.guard.js';
import {
  RequireReadAccess,
  ShopContext,
  type ShopContext as ShopContextType,
} from '../../auth/decorators.js';
import type { PaginatedResponse } from '@sales-planner/shared';
import {
  type ExpressResponse,
  type PaginationQuery,
  PaginationQuerySchema,
  sendCsvExport,
  sendJsonExport,
  ZodValidationPipe,
} from '../../common/index.js';
import { type SkuMetrics, SkuMetricsService } from './sku-metrics.service.js';

@Controller('sku-metrics')
@UseGuards(AuthGuard)
export class SkuMetricsController {
  constructor(private readonly skuMetricsService: SkuMetricsService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQuery,
  ): Promise<PaginatedResponse<SkuMetrics>> {
    return this.skuMetricsService.findByShopIdPaginated(ctx.shopId, query);
  }

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.skuMetricsService.findByShopId(ctx.shopId);
    const exportData = items.map((item) => ({
      code: item.skuCode,
      title: item.skuTitle,
      group: item.groupCode,
      category: item.categoryCode,
      status: item.statusCode,
      supplier: item.supplierCode,
      lastPeriod: item.lastPeriod,
      lastPeriodSales: item.lastPeriodSales,
      currentStock: item.currentStock,
      daysOfStock: item.daysOfStock,
      abcClass: item.abcClass,
      salesRank: item.salesRank,
    }));
    return sendCsvExport(res, exportData, 'sku-metrics', [
      'code',
      'title',
      'group',
      'category',
      'status',
      'supplier',
      'lastPeriod',
      'lastPeriodSales',
      'currentStock',
      'daysOfStock',
      'abcClass',
      'salesRank',
    ]);
  }

  @Get('export/json')
  @RequireReadAccess()
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.skuMetricsService.findByShopId(ctx.shopId);
    return sendJsonExport(res, items, 'sku-metrics');
  }

  @Get(':id')
  @RequireReadAccess()
  async findOne(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SkuMetrics> {
    const item = await this.skuMetricsService.findById(id);
    if (!item) {
      throw new NotFoundException(`SKU metrics with id ${id} not found`);
    }
    if (item.shopId !== ctx.shopId || item.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`SKU metrics with id ${id} not found in this shop/tenant`);
    }
    return item;
  }
}
