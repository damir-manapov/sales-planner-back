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
      code: item.sku_code,
      title: item.sku_title,
      group: item.group_code,
      category: item.category_code,
      status: item.status_code,
      supplier: item.supplier_code,
      lastPeriod: item.last_period,
      lastPeriodSales: item.last_period_sales,
      currentStock: item.current_stock,
      daysOfStock: item.days_of_stock,
      abcClass: item.abc_class,
      salesRank: item.sales_rank,
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
    if (item.shop_id !== ctx.shopId || item.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`SKU metrics with id ${id} not found in this shop/tenant`);
    }
    return item;
  }
}
