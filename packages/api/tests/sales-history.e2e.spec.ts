import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError, SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { normalizeCode, normalizeSkuCode } from '../src/lib/normalize-code.js';
import { TestContext } from './test-context.js';

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
      tenantTitle: `Test Tenant ${Date.now()}`,
      userEmail: `sales-test-${Date.now()}@example.com`,
      userName: 'Sales Test User',
    });

    // Create a test SKU
    skuCode = `SKU-SALES-${Date.now()}`;
    const sku = await ctx.client.createSku(
      { code: skuCode, title: 'Test SKU for Sales' },
      ctx.shopContext,
    );
    skuId = sku.id;

    // Create a test marketplace and store its ID
    const marketplace = await ctx.client.createMarketplace(
      { code: 'WB', title: 'Wildberries' },
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

      try {
        await noAuthClient.getSalesHistory(ctx.shopContext);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });
  });

  describe('CRUD operations', () => {
    it('POST /sales-history - should create sales history record', async () => {
      const record = await ctx.client.createSalesHistory(
        { sku_id: skuId, period: '2026-01', quantity: 100, marketplace_id: marketplaceId },
        ctx.shopContext,
      );

      expect(record).toHaveProperty('id');
      expect(record.sku_id).toBe(skuId);
      expect(record.period).toBe('2026-01');
      expect(record.quantity).toBe(100);
      expect(record.shop_id).toBe(ctx.shop.id);
      expect(record.tenant_id).toBe(ctx.tenant.id);
      expect(record.marketplace_id).toBe(marketplaceId);

      salesHistoryId = record.id;
    });

    it('POST /sales-history - should reject invalid period format', async () => {
      try {
        await ctx.client.createSalesHistory(
          { sku_id: skuId, period: '2026-13', quantity: 50, marketplace_id: marketplaceId },
          ctx.shopContext,
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
      }
    });

    it('POST /sales-history - should reject invalid period string', async () => {
      try {
        await ctx.client.createSalesHistory(
          { sku_id: skuId, period: '2026-1', quantity: 50, marketplace_id: marketplaceId },
          ctx.shopContext,
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
      }
    });

    it('GET /sales-history - should return sales history for shop', async () => {
      const records = await ctx.client.getSalesHistory(ctx.shopContext);

      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThan(0);
    });

    it('GET /sales-history - should filter by period range', async () => {
      const records = await ctx.client.getSalesHistory(ctx.shopContext, {
        period_from: '2026-01',
        period_to: '2026-12',
      });

      expect(Array.isArray(records)).toBe(true);
      records.forEach((r) => {
        expect(r.period >= '2026-01' && r.period <= '2026-12').toBe(true);
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
      salesHistoryId = 0;
    });

    it('POST /sales-history - should return 409 on duplicate period entry', async () => {
      const duplicateEntry = {
        sku_id: skuId,
        period: '2026-06',
        quantity: 100,
        marketplace_id: marketplaceId,
      };

      await ctx.client.createSalesHistory(duplicateEntry, ctx.shopContext);

      try {
        await ctx.client.createSalesHistory(duplicateEntry, ctx.shopContext);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(409);
      }
    });
  });

  describe('Bulk import', () => {
    it('POST /sales-history/import/json - should import multiple records', async () => {
      const result = await ctx.client.importSalesHistoryJson(
        [
          { marketplace: 'WB', period: '2025-11', sku: skuCode, quantity: 80 },
          { marketplace: 'WB', period: '2025-12', sku: skuCode, quantity: 90 },
        ],
        ctx.shopContext,
      );

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('POST /sales-history/import/json - should upsert existing records', async () => {
      const result = await ctx.client.importSalesHistoryJson(
        [{ marketplace: 'WB', period: '2025-11', sku: skuCode, quantity: 100 }],
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('POST /sales-history/import/json - should auto-create missing SKUs', async () => {
      const newSkuCode = `AUTO-SKU-${Date.now()}`;
      const normalizedSkuCode = normalizeSkuCode(newSkuCode);

      const result = await ctx.client.importSalesHistoryJson(
        [{ marketplace: 'WB', period: '2025-05', sku: newSkuCode, quantity: 50 }],
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
      const uniqueMarketplace = `MP-${Date.now()}`;
      const normalizedMarketplace = normalizeCode(uniqueMarketplace);

      const result = await ctx.client.importSalesHistoryJson(
        [{ marketplace: uniqueMarketplace, period: '2025-06', sku: skuCode, quantity: 30 }],
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
      const exportSkuCode = `EXPORT-SH-${Date.now()}`;
      const normalizedExportSkuCode = normalizeSkuCode(exportSkuCode);
      await ctx.client.importSkusJson(
        [{ code: exportSkuCode, title: 'Export Test SKU' }],
        ctx.shopContext,
      );

      // Import sales history
      await ctx.client.importSalesHistoryJson(
        [{ marketplace: 'OZON', period: '2025-07', sku: exportSkuCode, quantity: 100 }],
        ctx.shopContext,
      );

      // Export
      const exported = await ctx.client.exportSalesHistoryJson(ctx.shopContext);

      expect(Array.isArray(exported)).toBe(true);

      const item = exported.find(
        (r) => r.sku === normalizedExportSkuCode && r.period === '2025-07',
      );
      expect(item).toBeDefined();
      expect(item).toEqual({
        marketplace: normalizeCode('OZON'),
        period: '2025-07',
        sku: normalizedExportSkuCode,
        quantity: 100,
      });
    });

    it('GET /sales-history/export/json - should filter by period', async () => {
      const exported = await ctx.client.exportSalesHistoryJson(ctx.shopContext, {
        period_from: '2025-07',
        period_to: '2025-07',
      });

      expect(Array.isArray(exported)).toBe(true);

      // All returned items should have period 2025-07
      const periods = exported.map((r) => r.period);
      expect(periods.every((p) => p === '2025-07')).toBe(true);
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
      const skuCode = `CSV-IMPORT-${Date.now()}`;
      const normalizedSkuCode = normalizeSkuCode(skuCode);
      const csvContent = `marketplace,period,sku,quantity\nWB,2025-08,${skuCode},75`;

      const result = await ctx.client.importSalesHistoryCsv(csvContent, ctx.shopContext);

      expect(result).toHaveProperty('created');
      expect(result.created).toBeGreaterThanOrEqual(1);
      expect(result).toHaveProperty('skus_created');
      expect(result.skus_created).toBeGreaterThanOrEqual(1);

      // Verify the data was imported using the export endpoint which includes sku
      const exported = await ctx.client.exportSalesHistoryJson(ctx.shopContext, {
        period_from: '2025-08',
        period_to: '2025-08',
      });

      const imported = exported.find(
        (r) => r.sku === normalizedSkuCode && r.period === '2025-08',
      );
      expect(imported).toBeDefined();
      expect(imported?.quantity).toBe(75);
      expect(imported?.marketplace).toBe(normalizeCode('WB'));
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
