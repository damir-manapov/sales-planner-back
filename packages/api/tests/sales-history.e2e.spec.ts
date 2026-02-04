import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { SalesPlannerClient, ApiError } from '@sales-planner/http-client';
import { cleanupUser, SYSTEM_ADMIN_KEY } from './test-helpers.js';
import { normalizeCode, normalizeSkuCode } from '../src/lib/normalize-code.js';

describe('Sales History (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let systemClient: SalesPlannerClient;
  let client: SalesPlannerClient;

  let tenantId: number;
  let shopId: number;
  let skuId: number;
  let skuCode: string;
  let salesHistoryId: number;
  let testUserId: number;

  const ctx = () => ({ shop_id: shopId, tenant_id: tenantId });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);

    const url = await app.getUrl();
    baseUrl = url.replace('[::1]', 'localhost');

    systemClient = new SalesPlannerClient({
      baseUrl,
      apiKey: SYSTEM_ADMIN_KEY,
    });

    // Create tenant with shop and user in one call
    const setup = await systemClient.createTenantWithShopAndUser({
      tenantTitle: `Test Tenant ${Date.now()}`,
      userEmail: `sales-test-${Date.now()}@example.com`,
      userName: 'Sales Test User',
    });

    testUserId = setup.user.id;
    tenantId = setup.tenant.id;
    shopId = setup.shop.id;

    client = new SalesPlannerClient({
      baseUrl,
      apiKey: setup.apiKey,
    });

    // Create a test SKU
    skuCode = `SKU-SALES-${Date.now()}`;
    const sku = await client.createSku({ code: skuCode, title: 'Test SKU for Sales' }, ctx());
    skuId = sku.id;

    // Create a test marketplace
    await client.createMarketplace({ id: 'WB', title: 'Wildberries' }, ctx());
  });

  afterAll(async () => {
    // Cleanup using helper that handles foreign key constraints
    if (testUserId) {
      await cleanupUser(app, testUserId);
    }
    await app.close();
  });

  describe('Authentication', () => {
    it('GET /sales-history - should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });

      try {
        await noAuthClient.getSalesHistory(ctx());
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });
  });

  describe('CRUD operations', () => {
    it('POST /sales-history - should create sales history record', async () => {
      const record = await client.createSalesHistory(
        { sku_id: skuId, period: '2026-01', quantity: 100, marketplace_id: 'WB' },
        ctx(),
      );

      expect(record).toHaveProperty('id');
      expect(record.sku_id).toBe(skuId);
      expect(record.period).toBe('2026-01');
      expect(record.quantity).toBe(100);
      expect(record.shop_id).toBe(shopId);
      expect(record.tenant_id).toBe(tenantId);
      expect(record.marketplace_id).toBe('WB');

      salesHistoryId = record.id;
    });

    it('POST /sales-history - should reject invalid period format', async () => {
      try {
        await client.createSalesHistory(
          { sku_id: skuId, period: '2026-13', quantity: 50, marketplace_id: 'WB' },
          ctx(),
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
      }
    });

    it('POST /sales-history - should reject invalid period string', async () => {
      try {
        await client.createSalesHistory(
          { sku_id: skuId, period: '2026-1', quantity: 50, marketplace_id: 'WB' },
          ctx(),
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
      }
    });

    it('GET /sales-history - should return sales history for shop', async () => {
      const records = await client.getSalesHistory(ctx());

      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThan(0);
    });

    it('GET /sales-history - should filter by period range', async () => {
      const records = await client.getSalesHistory(ctx(), {
        period_from: '2026-01',
        period_to: '2026-12',
      });

      expect(Array.isArray(records)).toBe(true);
      records.forEach((r) => {
        expect(r.period >= '2026-01' && r.period <= '2026-12').toBe(true);
      });
    });

    it('GET /sales-history/:id - should return record by id', async () => {
      const record = await client.getSalesHistoryItem(salesHistoryId, ctx());

      expect(record.id).toBe(salesHistoryId);
    });

    it('PUT /sales-history/:id - should update record', async () => {
      const record = await client.updateSalesHistory(salesHistoryId, { quantity: 150 }, ctx());

      expect(record.quantity).toBe(150);
    });

    it('DELETE /sales-history/:id - should delete record', async () => {
      await client.deleteSalesHistory(salesHistoryId, ctx());
      salesHistoryId = 0;
    });

    it('POST /sales-history - should return 409 on duplicate period entry', async () => {
      const duplicateEntry = {
        sku_id: skuId,
        period: '2026-06',
        quantity: 100,
        marketplace_id: 'WB',
      };

      await client.createSalesHistory(duplicateEntry, ctx());

      try {
        await client.createSalesHistory(duplicateEntry, ctx());
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(409);
      }
    });
  });

  describe('Bulk import', () => {
    it('POST /sales-history/import/json - should import multiple records', async () => {
      const result = await client.importSalesHistoryJson(
        [
          { sku_code: skuCode, period: '2025-11', quantity: 80, marketplace: 'WB' },
          { sku_code: skuCode, period: '2025-12', quantity: 90, marketplace: 'WB' },
        ],
        ctx(),
      );

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('POST /sales-history/import/json - should upsert existing records', async () => {
      const result = await client.importSalesHistoryJson(
        [{ sku_code: skuCode, period: '2025-11', quantity: 100, marketplace: 'WB' }],
        ctx(),
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('POST /sales-history/import/json - should auto-create missing SKUs', async () => {
      const newSkuCode = `AUTO-SKU-${Date.now()}`;
      const normalizedSkuCode = normalizeSkuCode(newSkuCode);

      const result = await client.importSalesHistoryJson(
        [{ sku_code: newSkuCode, period: '2025-05', quantity: 50, marketplace: 'WB' }],
        ctx(),
      );

      expect(result.created).toBe(1);
      expect(result.skus_created).toBe(1);
      expect(result.errors).toEqual([]);

      // Verify SKU was actually created
      const skus = await client.getSkus(ctx());
      const createdSku = skus.find((s) => s.code === normalizedSkuCode);
      expect(createdSku).toBeDefined();
      expect(createdSku?.title).toBe(normalizedSkuCode); // Title defaults to code
    });

    it('POST /sales-history/import/json - should auto-create missing marketplaces', async () => {
      const uniqueMarketplace = `MP-${Date.now()}`;
      const normalizedMarketplace = normalizeCode(uniqueMarketplace);

      const result = await client.importSalesHistoryJson(
        [{ sku_code: skuCode, period: '2025-06', quantity: 30, marketplace: uniqueMarketplace }],
        ctx(),
      );

      expect(result.created).toBe(1);
      expect(result.marketplaces_created).toBe(1);
      expect(result.errors).toEqual([]);

      // Verify marketplace was actually created
      const marketplaces = await client.getMarketplaces(ctx());
      const createdMp = marketplaces.find((m) => m.id === normalizedMarketplace);
      expect(createdMp).toBeDefined();
      expect(createdMp?.title).toBe(normalizedMarketplace); // Title defaults to id
    });

    it('GET /sales-history/export/json - should export sales history in import format', async () => {
      // Create SKU and sales history data
      const exportSkuCode = `EXPORT-SH-${Date.now()}`;
      const normalizedExportSkuCode = normalizeSkuCode(exportSkuCode);
      await client.importSkusJson([{ code: exportSkuCode, title: 'Export Test SKU' }], ctx());

      // Import sales history
      await client.importSalesHistoryJson(
        [{ sku_code: exportSkuCode, period: '2025-07', quantity: 100, marketplace: 'OZON' }],
        ctx(),
      );

      // Export
      const exported = await client.exportSalesHistoryJson(ctx());

      expect(Array.isArray(exported)).toBe(true);

      const item = exported.find(
        (r) => r.sku_code === normalizedExportSkuCode && r.period === '2025-07',
      );
      expect(item).toBeDefined();
      expect(item).toEqual({
        sku_code: normalizedExportSkuCode,
        period: '2025-07',
        quantity: 100,
        marketplace: normalizeCode('OZON'),
      });
    });

    it('GET /sales-history/export/json - should filter by period', async () => {
      const exported = await client.exportSalesHistoryJson(ctx(), {
        period_from: '2025-07',
        period_to: '2025-07',
      });

      expect(Array.isArray(exported)).toBe(true);

      // All returned items should have period 2025-07
      const periods = exported.map((r) => r.period);
      expect(periods.every((p) => p === '2025-07')).toBe(true);
    });

    it('GET /sales-history/export/csv - should export sales history in CSV format', async () => {
      const csv = await client.exportSalesHistoryCsv(ctx());

      expect(csv).toBeTruthy();
      expect(typeof csv).toBe('string');

      const lines = csv.split('\n');
      expect(lines[0]).toBe('sku_code,period,quantity,marketplace');
      expect(lines.length).toBeGreaterThan(1);
    });

    it('POST /sales-history/import/csv - should import sales history from CSV', async () => {
      const skuCode = `CSV-IMPORT-${Date.now()}`;
      const normalizedSkuCode = normalizeSkuCode(skuCode);
      const csvContent = `sku_code,period,quantity,marketplace\n${skuCode},2025-08,75,WB`;

      const result = await client.importSalesHistoryCsv(csvContent, ctx());

      expect(result).toHaveProperty('created');
      expect(result.created).toBeGreaterThanOrEqual(1);
      expect(result).toHaveProperty('skus_created');
      expect(result.skus_created).toBeGreaterThanOrEqual(1);

      // Verify the data was imported using the export endpoint which includes sku_code
      const exported = await client.exportSalesHistoryJson(ctx(), {
        period_from: '2025-08',
        period_to: '2025-08',
      });

      const imported = exported.find(
        (r) => r.sku_code === normalizedSkuCode && r.period === '2025-08',
      );
      expect(imported).toBeDefined();
      expect(imported?.quantity).toBe(75);
      expect(imported?.marketplace).toBe(normalizeCode('WB'));
    });
  });

  describe('Example downloads', () => {
    it('GET /sales-history/examples/json - should return JSON example without auth', async () => {
      const example = await client.getSalesHistoryExampleJson();

      expect(Array.isArray(example)).toBe(true);
      expect(example.length).toBeGreaterThan(0);
      expect(example[0]).toHaveProperty('sku_code');
      expect(example[0]).toHaveProperty('period');
      expect(example[0]).toHaveProperty('quantity');
    });

    it('GET /sales-history/examples/csv - should return CSV example without auth', async () => {
      const csv = await client.getSalesHistoryExampleCsv();

      expect(csv).toContain('sku_code,period,quantity');
      expect(csv).toContain('SKU-001');
    });
  });
});
