import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { normalizeCode, normalizeSkuCode } from '../src/lib/normalize-code.js';
import { TestContext } from './test-context.js';
import {
  generateUniqueId,
  generateTestPeriod,
  generateTestPeriodRange,
  generateTestCode,
  expectUnauthorized,
  expectApiError,
  expectNotFound,
  expectConflict,
} from './test-helpers.js';

describe('Sales History (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let skuId: number;
  let skuCode: string;
  let salesHistoryId: number;
  let marketplaceId: number;

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
      userEmail: `sales-test-${generateUniqueId()}@example.com`,
      userName: 'Sales Test User',
    });

    // Create a test SKU
    skuCode = generateTestCode('SKU-SALES');
    const sku = await ctx.client.createSku(
      { code: skuCode, title: 'Test SKU for Sales' },
      ctx.shopContext,
    );
    skuId = sku.id;

    // Create a test marketplace and store its ID
    const marketplace = await ctx.client.createMarketplace(
      { code: generateTestCode('WB'), title: 'Wildberries' },
      ctx.shopContext,
    );
    marketplaceId = marketplace.id;
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('GET /sales-history - should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });

      await expectUnauthorized(() => noAuthClient.getSalesHistory(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('POST /sales-history - should create sales history record', async () => {
      const testPeriod = generateTestPeriod();
      const record = await ctx.client.createSalesHistory(
        { sku_id: skuId, period: testPeriod, quantity: 100, marketplace_id: marketplaceId },
        ctx.shopContext,
      );

      expect(record).toHaveProperty('id');
      expect(record.sku_id).toBe(skuId);
      expect(record.period).toBe(testPeriod);
      expect(record.quantity).toBe(100);
      expect(record.shop_id).toBe(ctx.shop.id);
      expect(record.tenant_id).toBe(ctx.tenant.id);
      expect(record.marketplace_id).toBe(marketplaceId);

      salesHistoryId = record.id;
    });

    it('POST /sales-history - should reject invalid period format', async () => {
      await expectApiError(
        () =>
          ctx.client.createSalesHistory(
            { sku_id: skuId, period: '2026-13', quantity: 50, marketplace_id: marketplaceId },
            ctx.shopContext,
          ),
        400,
      );
    });

    it('POST /sales-history - should reject invalid period string', async () => {
      await expectApiError(
        () =>
          ctx.client.createSalesHistory(
            { sku_id: skuId, period: '2026-1', quantity: 50, marketplace_id: marketplaceId },
            ctx.shopContext,
          ),
        400,
      );
    });

    it('GET /sales-history - should return sales history for shop', async () => {
      const records = await ctx.client.getSalesHistory(ctx.shopContext);

      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThan(0);
    });

    it('GET /sales-history - should filter by period range', async () => {
      const [periodFrom, periodTo] = generateTestPeriodRange();

      // Create unique marketplace for this test to avoid period collisions
      const rangeTestMarketplace = await ctx.client.createMarketplace(
        { code: generateTestCode('MP-RANGE'), title: 'Range Test MP' },
        ctx.shopContext,
      );

      // Create test records within the range
      await ctx.client.createSalesHistory(
        {
          sku_id: skuId,
          period: periodFrom,
          quantity: 50,
          marketplace_id: rangeTestMarketplace.id,
        },
        ctx.shopContext,
      );
      await ctx.client.createSalesHistory(
        { sku_id: skuId, period: periodTo, quantity: 60, marketplace_id: rangeTestMarketplace.id },
        ctx.shopContext,
      );

      const records = await ctx.client.getSalesHistory(ctx.shopContext, {
        period_from: periodFrom,
        period_to: periodTo,
      });

      expect(Array.isArray(records)).toBe(true);
      records.forEach((r) => {
        expect(r.period >= periodFrom && r.period <= periodTo).toBe(true);
      });
    });

    it('GET /sales-history/:id - should return record by id', async () => {
      const record = await ctx.client.getSalesHistoryItem(salesHistoryId, ctx.shopContext);

      expect(record.id).toBe(salesHistoryId);
    });

    it('PUT /sales-history/:id - should update record', async () => {
      const record = await ctx.client.updateSalesHistory(
        salesHistoryId,
        { quantity: 150 },
        ctx.shopContext,
      );

      expect(record.quantity).toBe(150);
    });

    it('DELETE /sales-history/:id - should delete record', async () => {
      await ctx.client.deleteSalesHistory(salesHistoryId, ctx.shopContext);
    });

    it('GET /sales-history/:id - should return 404 for non-existent record', async () => {
      await expectNotFound(() => ctx.client.getSalesHistoryItem(999999, ctx.shopContext));
    });

    it('POST /sales-history - should return 409 on duplicate period entry', async () => {
      const testPeriod = generateTestPeriod();
      const duplicateEntry = {
        sku_id: skuId,
        period: testPeriod,
        quantity: 100,
        marketplace_id: marketplaceId,
      };

      await ctx.client.createSalesHistory(duplicateEntry, ctx.shopContext);

      await expectConflict(() => ctx.client.createSalesHistory(duplicateEntry, ctx.shopContext));
    });
  });

  describe('Bulk import', () => {
    it('POST /sales-history/import/json - should import multiple records', async () => {
      const marketplaceCode = generateTestCode('WB');
      const [period1, period2] = generateTestPeriodRange();

      const result = await ctx.client.importSalesHistoryJson(
        [
          { marketplace: marketplaceCode, period: period1, sku: skuCode, quantity: 80 },
          { marketplace: marketplaceCode, period: period2, sku: skuCode, quantity: 90 },
        ],
        ctx.shopContext,
      );

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('POST /sales-history/import/json - should upsert existing records', async () => {
      const marketplaceCode = generateTestCode('WB-UPSERT');
      const testPeriod = generateTestPeriod();

      // First import
      await ctx.client.importSalesHistoryJson(
        [{ marketplace: marketplaceCode, period: testPeriod, sku: skuCode, quantity: 80 }],
        ctx.shopContext,
      );

      // Update the same record
      const result = await ctx.client.importSalesHistoryJson(
        [{ marketplace: marketplaceCode, period: testPeriod, sku: skuCode, quantity: 100 }],
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('POST /sales-history/import/json - should auto-create missing SKUs', async () => {
      const newSkuCode = generateTestCode('AUTO-SKU');
      const normalizedSkuCode = normalizeSkuCode(newSkuCode);
      const marketplaceCode = generateTestCode('WB-AUTO');
      const testPeriod = generateTestPeriod();

      const result = await ctx.client.importSalesHistoryJson(
        [{ marketplace: marketplaceCode, period: testPeriod, sku: newSkuCode, quantity: 50 }],
        ctx.shopContext,
      );

      expect(result.created).toBe(1);
      expect(result.skus_created).toBe(1);
      expect(result.errors).toEqual([]);

      // Verify SKU was actually created
      const skus = await ctx.client.getSkus(ctx.shopContext);
      const createdSku = skus.find((s) => s.code === normalizedSkuCode);
      expect(createdSku).toBeDefined();
      expect(createdSku?.title).toBe(normalizedSkuCode); // Title defaults to code
    });

    it('POST /sales-history/import/json - should auto-create missing marketplaces', async () => {
      // Create a unique SKU for this test to avoid conflicts
      const uniqueSku = generateTestCode('SKU-MP-TEST');
      await ctx.client.createSku(
        { code: uniqueSku, title: 'Test SKU for MP auto-creation' },
        ctx.shopContext,
      );

      const uniqueMarketplace = generateTestCode('MP');
      const normalizedMarketplace = normalizeCode(uniqueMarketplace);
      const testPeriod = generateTestPeriod();

      const result = await ctx.client.importSalesHistoryJson(
        [{ marketplace: uniqueMarketplace, period: testPeriod, sku: uniqueSku, quantity: 30 }],
        ctx.shopContext,
      );

      expect(result.created).toBe(1);
      expect(result.marketplaces_created).toBe(1);
      expect(result.errors).toEqual([]);

      // Verify marketplace was actually created
      const marketplaces = await ctx.client.getMarketplaces(ctx.shopContext);
      const createdMp = marketplaces.find((m) => m.code === normalizedMarketplace);
      expect(createdMp).toBeDefined();
      expect(createdMp?.title).toBe(normalizedMarketplace); // Title defaults to code
    });

    it('GET /sales-history/export/json - should export sales history in import format', async () => {
      // Create SKU and sales history data
      const exportSkuCode = generateTestCode('EXPORT-SH');
      const normalizedExportSkuCode = normalizeSkuCode(exportSkuCode);
      const marketplaceCode = generateTestCode('OZON');
      const normalizedMarketplace = normalizeCode(marketplaceCode);
      const testPeriod = generateTestPeriod();

      await ctx.client.importSkusJson(
        [{ code: exportSkuCode, title: 'Export Test SKU' }],
        ctx.shopContext,
      );

      // Import sales history
      await ctx.client.importSalesHistoryJson(
        [{ marketplace: marketplaceCode, period: testPeriod, sku: exportSkuCode, quantity: 100 }],
        ctx.shopContext,
      );

      // Export
      const exported = await ctx.client.exportSalesHistoryJson(ctx.shopContext);

      expect(Array.isArray(exported)).toBe(true);

      const item = exported.find(
        (r) => r.sku === normalizedExportSkuCode && r.period === testPeriod,
      );
      expect(item).toBeDefined();
      expect(item).toEqual({
        marketplace: normalizedMarketplace,
        period: testPeriod,
        sku: normalizedExportSkuCode,
        quantity: 100,
      });
    });

    it('GET /sales-history/export/json - should filter by period', async () => {
      const testPeriod = generateTestPeriod();
      const exportSkuCode = generateTestCode('FILTER-TEST');
      const marketplaceCode = generateTestCode('MP-FILTER');

      // Create test data within the specific period
      await ctx.client.importSalesHistoryJson(
        [{ marketplace: marketplaceCode, period: testPeriod, sku: exportSkuCode, quantity: 50 }],
        ctx.shopContext,
      );

      const exported = await ctx.client.exportSalesHistoryJson(ctx.shopContext, {
        period_from: testPeriod,
        period_to: testPeriod,
      });

      expect(Array.isArray(exported)).toBe(true);

      // All returned items should have the test period
      const periods = exported.map((r) => r.period);
      expect(periods.every((p) => p === testPeriod)).toBe(true);
    });

    it('GET /sales-history/export/csv - should export sales history in CSV format', async () => {
      const csv = await ctx.client.exportSalesHistoryCsv(ctx.shopContext);

      expect(csv).toBeTruthy();
      expect(typeof csv).toBe('string');

      const lines = csv.split('\n');
      expect(lines[0]).toBe('marketplace,period,sku,quantity');
      expect(lines.length).toBeGreaterThan(1);
    });

    it('POST /sales-history/import/csv - should import sales history from CSV', async () => {
      const csvSkuCode = generateTestCode('CSV-IMPORT');
      const normalizedSkuCode = normalizeSkuCode(csvSkuCode);
      const marketplaceCode = generateTestCode('WB-CSV');
      const normalizedMarketplace = normalizeCode(marketplaceCode);
      const testPeriod = generateTestPeriod();
      const csvContent = `marketplace,period,sku,quantity\n${marketplaceCode},${testPeriod},${csvSkuCode},75`;

      const result = await ctx.client.importSalesHistoryCsv(csvContent, ctx.shopContext);

      expect(result).toHaveProperty('created');
      expect(result.created).toBeGreaterThanOrEqual(1);
      expect(result).toHaveProperty('skus_created');
      expect(result.skus_created).toBeGreaterThanOrEqual(1);

      // Verify the data was imported using the export endpoint which includes sku
      const exported = await ctx.client.exportSalesHistoryJson(ctx.shopContext, {
        period_from: testPeriod,
        period_to: testPeriod,
      });

      const imported = exported.find((r) => r.sku === normalizedSkuCode && r.period === testPeriod);
      expect(imported).toBeDefined();
      expect(imported?.quantity).toBe(75);
      expect(imported?.marketplace).toBe(normalizedMarketplace);
    });
  });

  describe('Example downloads', () => {
    it('GET /sales-history/examples/json - should return JSON example without auth', async () => {
      const example = await ctx.client.getSalesHistoryExampleJson();

      expect(Array.isArray(example)).toBe(true);
      expect(example.length).toBeGreaterThan(0);
      expect(example[0]).toHaveProperty('marketplace');
      expect(example[0]).toHaveProperty('period');
      expect(example[0]).toHaveProperty('sku');
      expect(example[0]).toHaveProperty('quantity');
    });

    it('GET /sales-history/examples/csv - should return CSV example without auth', async () => {
      const csv = await ctx.client.getSalesHistoryExampleCsv();

      expect(csv).toContain('marketplace,period,sku,quantity');
      expect(csv).toContain('SKU-001');
    });
  });
});
