import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ApiError, SalesPlannerClient, type ShopContextParams } from '@sales-planner/http-client';
import { AppModule } from '../src/app.module.js';
import { TestContext } from './test-context.js';
import { generateTestCode, generateUniqueId, getCurrentPeriod } from './test-helpers.js';

interface MetricsTestData {
  skuCodes: string[];
  noSalesSkuCode: string;
  warehouseCode: string;
  marketplaceCode: string;
  period: string;
}

/**
 * Setup test data for metrics computation tests.
 * Creates SKUs, warehouse, marketplace, sales history, and leftovers.
 */
async function setupMetricsTestData(
  client: SalesPlannerClient,
  shopContext: ShopContextParams,
): Promise<MetricsTestData> {
  const period = getCurrentPeriod();

  // Create 5 SKUs with sales + 1 without
  const skuCodes = Array.from({ length: 5 }, (_, i) => generateTestCode(`sku${i + 1}`));
  const noSalesSkuCode = generateTestCode('no-sales');

  await client.skus.importJson(shopContext, [
    ...skuCodes.map((code, i) => ({ code, title: `SKU ${i + 1}` })),
    { code: noSalesSkuCode, title: 'No Sales SKU' },
  ]);

  // Create warehouse and marketplace
  const warehouseCode = generateTestCode('wh');
  const marketplaceCode = generateTestCode('mp');

  await client.warehouses.importJson(shopContext, [
    { code: warehouseCode, title: 'Test Warehouse' },
  ]);
  await client.marketplaces.importJson(shopContext, [
    { code: marketplaceCode, title: 'Test Marketplace' },
  ]);

  // Add sales history with decreasing quantities for ABC ranking
  const salesQuantities = [1000, 500, 100, 50, 10] as const;
  await client.salesHistory.importJson(
    shopContext,
    skuCodes.map((sku, i) => ({
      sku,
      marketplace: marketplaceCode,
      period,
      quantity: salesQuantities[i] ?? 0,
    })),
  );

  // Add inventory for some SKUs
  await client.leftovers.importJson(shopContext, [
    { sku: skuCodes[0] as string, warehouse: warehouseCode, period, quantity: 500 },
    { sku: skuCodes[1] as string, warehouse: warehouseCode, period, quantity: 450 },
    { sku: noSalesSkuCode, warehouse: warehouseCode, period, quantity: 100 },
  ]);

  return {
    skuCodes,
    noSalesSkuCode,
    warehouseCode,
    marketplaceCode,
    period,
  };
}

/**
 * SKU Metrics E2E Tests
 *
 * Requires the materialized view `mv_sku_metrics` to exist.
 * Run `npx tsx scripts/apply-views.ts` on the test database to create the view.
 */
describe('SkuMetricsController (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);

    const url = await app.getUrl();
    baseUrl = url.replace('[::1]', 'localhost');

    ctx = await TestContext.create(app, baseUrl, {
      tenantTitle: `Test Tenant ${generateUniqueId()}`,
      userEmail: `sku-metrics-test-${generateUniqueId()}@example.com`,
      userName: 'SKU Metrics Test User',
    });
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('GET /sku-metrics', () => {
    it('should return empty list when no SKUs exist', async () => {
      const data = await ctx.client.skuMetrics.list(ctx.shop.id, ctx.tenant.id);

      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('total');
      expect(data.items).toBeInstanceOf(Array);
    });

    it('should return 401 without auth', async () => {
      const unauthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      try {
        await unauthClient.skuMetrics.list(ctx.shop.id, ctx.tenant.id);
        expect.fail('Expected error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });
  });

  describe('GET /computed/views', () => {
    it('should list available materialized views', async () => {
      const data = await ctx.client.computed.getViews(ctx.shop.id, ctx.tenant.id);

      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);

      const skuMetricsView = data.find((v) => v.name === 'mv_sku_metrics');
      expect(skuMetricsView).toBeDefined();
      expect(skuMetricsView?.description).toBeDefined();
    });
  });

  describe('POST /computed/refresh', () => {
    it('should refresh all materialized views', async () => {
      const data = await ctx.client.computed.refreshAll(ctx.shop.id, ctx.tenant.id);

      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('totalDuration');
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
    });
  });

  describe('POST /computed/refresh/:viewName', () => {
    it('should refresh a specific view', async () => {
      const data = await ctx.client.computed.refreshView(
        'mv_sku_metrics',
        ctx.shop.id,
        ctx.tenant.id,
      );

      expect(data).toHaveProperty('view');
      expect(data).toHaveProperty('duration');
      expect(data).toHaveProperty('success');
      expect(data.view).toBe('mv_sku_metrics');
      expect(data.success).toBe(true);
    });

    it('should return error for unknown view', async () => {
      const data = await ctx.client.computed.refreshView(
        'unknown_view',
        ctx.shop.id,
        ctx.tenant.id,
      );

      expect(data.success).toBe(false);
      expect(data.error).toContain('Unknown view');
    });
  });

  describe('GET /sku-metrics/export/csv', () => {
    it('should export CSV with header', async () => {
      const csv = await ctx.client.skuMetrics.exportCsv(ctx.shop.id, ctx.tenant.id);

      expect(typeof csv).toBe('string');
      const lines = csv.split('\n');
      // Header should always be present with all columns, even with no data
      expect(lines[0]).toBe(
        'skuId,skuCode,skuTitle,groupCode,categoryCode,brandCode,statusCode,supplierCode,lastPeriod,lastPeriodSales,currentStock,daysOfStock,abcClass,salesRank,computedAt',
      );
    });

    it('should export CSV with SKU data after refresh', async () => {
      // Create a SKU
      const skuCode = generateTestCode('sku');
      await ctx.client.skus.importJson(ctx.shopContext, [{ code: skuCode, title: 'Test SKU' }]);

      // Refresh the materialized view
      await ctx.client.computed.refreshView('mv_sku_metrics', ctx.shop.id, ctx.tenant.id);

      // Export and verify
      const csv = await ctx.client.skuMetrics.exportCsv(ctx.shop.id, ctx.tenant.id);
      const lines = csv.split('\n');

      expect(lines.length).toBeGreaterThan(1); // Header + at least 1 data row
      expect(lines.some((line) => line.includes(skuCode))).toBe(true);
    });
  });

  describe('GET /sku-metrics/export/json', () => {
    it('should export JSON with SKU data', async () => {
      // Create a SKU
      const skuCode = generateTestCode('json-sku');
      await ctx.client.skus.importJson(ctx.shopContext, [
        { code: skuCode, title: 'JSON Test SKU' },
      ]);

      // Refresh the materialized view
      await ctx.client.computed.refreshView('mv_sku_metrics', ctx.shop.id, ctx.tenant.id);

      // Export and verify
      const data = await ctx.client.skuMetrics.exportJson(ctx.shop.id, ctx.tenant.id);

      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);

      const sku = data.find((item) => item.sku_code === skuCode);
      expect(sku).toBeDefined();
      expect(sku?.sku_title).toBe('JSON Test SKU');
      expect(sku?.abc_class).toBe('C'); // No sales, so should be class C
    });
  });

  describe('Computed metrics', () => {
    it('should compute sales, stock and ABC classification correctly', async () => {
      // Create a fresh shop for this test to get clean ABC classification
      const metricsShop = await ctx.client.shops.create({
        title: `Metrics Test Shop ${generateUniqueId()}`,
        tenant_id: ctx.tenant.id,
      });
      const metricsShopContext = { shop_id: metricsShop.id, tenant_id: ctx.tenant.id };

      // Setup test data using helper
      const testData = await setupMetricsTestData(ctx.client, metricsShopContext);

      // Refresh the materialized view
      await ctx.client.computed.refreshView('mv_sku_metrics', metricsShop.id, ctx.tenant.id);

      // Export and verify computed metrics
      const data = await ctx.client.skuMetrics.exportJson(metricsShop.id, ctx.tenant.id);

      // Verify SKU1 (rank 1 of 5 = 20%, class A)
      const result1 = data.find((item) => item.sku_code === testData.skuCodes[0]);
      expect(result1).toBeDefined();
      expect(Number(result1?.last_period_sales)).toBe(1000);
      expect(Number(result1?.current_stock)).toBe(500);
      expect(Number(result1?.days_of_stock)).toBe(15); // (500/1000)*30 = 15 days
      expect(result1?.abc_class).toBe('A'); // Top 20%
      expect(Number(result1?.sales_rank)).toBe(1);

      // Verify SKU2 (rank 2 of 5 = 40%, class B)
      const result2 = data.find((item) => item.sku_code === testData.skuCodes[1]);
      expect(result2).toBeDefined();
      expect(Number(result2?.last_period_sales)).toBe(500);
      expect(Number(result2?.current_stock)).toBe(450);
      expect(Number(result2?.days_of_stock)).toBe(27); // (450/500)*30 = 27 days
      expect(result2?.abc_class).toBe('B'); // 20-50%
      expect(Number(result2?.sales_rank)).toBe(2);

      // Verify SKU5 (rank 5 of 5 = 100%, class C)
      const result5 = data.find((item) => item.sku_code === testData.skuCodes[4]);
      expect(result5).toBeDefined();
      expect(Number(result5?.last_period_sales)).toBe(10);
      expect(result5?.abc_class).toBe('C'); // Bottom 50%
      expect(Number(result5?.sales_rank)).toBe(5);

      // Verify no sales SKU
      const noSales = data.find((item) => item.sku_code === testData.noSalesSkuCode);
      expect(noSales).toBeDefined();
      expect(Number(noSales?.last_period_sales)).toBe(0);
      expect(Number(noSales?.current_stock)).toBe(100);
      expect(noSales?.days_of_stock).toBeNull(); // Cannot compute without sales
      expect(noSales?.abc_class).toBe('C'); // No sales = class C

      // Cleanup
      await ctx.client.shops.delete(metricsShop.id);
    });
  });
});
