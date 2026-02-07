import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError, SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ROLE_NAMES } from '../src/common/constants.js';
import { normalizeCode, normalizeSkuCode } from '../src/lib/normalize-code.js';
import { TestContext } from './test-context.js';
import {
  cleanupUser,
  expectApiError,
  expectConflict,
  expectForbidden,
  expectNotFound,
  expectUnauthorized,
  generateTestCode,
  generateTestPeriod,
  generateTestPeriodRange,
  generateUniqueId,
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
    const sku = await ctx.client.skus.create(ctx.shopContext, {
      code: skuCode,
      title: 'Test SKU for Sales',
    });
    skuId = sku.id;

    // Create a test marketplace
    const marketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
      code: generateTestCode('WB'),
      title: 'Wildberries',
    });
    marketplaceId = marketplace.id;
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.salesHistory.getAll(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.salesHistory.getAll(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create sales history record', async () => {
      const testPeriod = generateTestPeriod();
      const record = await ctx.client.salesHistory.create(ctx.shopContext, {
        sku_id: skuId,
        period: testPeriod,
        quantity: 100,
        marketplace_id: marketplaceId,
      });

      expect(record).toHaveProperty('id');
      expect(record.sku_id).toBe(skuId);
      expect(record.period).toBe(testPeriod);
      expect(record.quantity).toBe(100);
      expect(record.shop_id).toBe(ctx.shop.id);
      expect(record.tenant_id).toBe(ctx.tenant.id);
      expect(record.marketplace_id).toBe(marketplaceId);

      salesHistoryId = record.id;
    });

    it('should list sales history', async () => {
      const records = await ctx.client.salesHistory.getAll(ctx.shopContext);

      expect(Array.isArray(records.items)).toBe(true);
      expect(records.items.length).toBeGreaterThan(0);
    });

    it('should filter by period range', async () => {
      const [periodFrom, periodTo] = generateTestPeriodRange();

      const rangeTestMarketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
        code: generateTestCode('MP-RANGE'),
        title: 'Range Test MP',
      });

      await ctx.client.salesHistory.create(ctx.shopContext, {
        sku_id: skuId,
        period: periodFrom,
        quantity: 50,
        marketplace_id: rangeTestMarketplace.id,
      });
      await ctx.client.salesHistory.create(ctx.shopContext, {
        sku_id: skuId,
        period: periodTo,
        quantity: 60,
        marketplace_id: rangeTestMarketplace.id,
      });

      const records = await ctx.client.salesHistory.getAll(ctx.shopContext, {
        period_from: periodFrom,
        period_to: periodTo,
      });

      expect(Array.isArray(records.items)).toBe(true);
      records.items.forEach((r) => {
        expect(r.period >= periodFrom && r.period <= periodTo).toBe(true);
      });
    });

    it('should get sales history by id', async () => {
      const record = await ctx.client.salesHistory.getById(ctx.shopContext, salesHistoryId);

      expect(record.id).toBe(salesHistoryId);
    });

    it('should update sales history', async () => {
      const record = await ctx.client.salesHistory.update(ctx.shopContext, salesHistoryId, {
        quantity: 150,
      });

      expect(record.quantity).toBe(150);
    });

    it('should reject invalid period format', async () => {
      await expectApiError(
        () =>
          ctx.client.salesHistory.create(ctx.shopContext, {
            sku_id: skuId,
            period: '2026-13',
            quantity: 50,
            marketplace_id: marketplaceId,
          }),
        400,
      );
    });

    it('should reject invalid period string', async () => {
      await expectApiError(
        () =>
          ctx.client.salesHistory.create(ctx.shopContext, {
            sku_id: skuId,
            period: '2026-1',
            quantity: 50,
            marketplace_id: marketplaceId,
          }),
        400,
      );
    });

    it('should return 409 on duplicate period entry', async () => {
      const testPeriod = generateTestPeriod();
      const duplicateEntry = {
        sku_id: skuId,
        period: testPeriod,
        quantity: 100,
        marketplace_id: marketplaceId,
      };

      await ctx.client.salesHistory.create(ctx.shopContext, duplicateEntry);

      await expectConflict(() => ctx.client.salesHistory.create(ctx.shopContext, duplicateEntry));
    });

    it('should return 404 for non-existent record', async () => {
      await expectNotFound(() => ctx.client.salesHistory.getById(ctx.shopContext, 999999));
    });
  });

  describe('Pagination', () => {
    const paginationRecords: number[] = [];
    let paginationSku: { id: number; code: string };
    let paginationMarketplace: { id: number; code: string };

    beforeAll(async () => {
      // Create dedicated SKU and marketplace for pagination tests
      const sku = await ctx.client.skus.create(ctx.shopContext, {
        code: generateTestCode('SKU-PAGINATION'),
        title: 'Pagination Test SKU',
      });
      paginationSku = { id: sku.id, code: sku.code };

      const mp = await ctx.client.marketplaces.create(ctx.shopContext, {
        code: generateTestCode('MP-PAGINATION'),
        title: 'Pagination Test MP',
      });
      paginationMarketplace = { id: mp.id, code: mp.code };

      // Create 15 sales history records with different periods
      for (let i = 0; i < 15; i++) {
        const year = 2020 + Math.floor(i / 12);
        const month = (i % 12) + 1;
        const period = `${year}-${month.toString().padStart(2, '0')}`;

        const record = await ctx.client.salesHistory.create(ctx.shopContext, {
          sku_id: paginationSku.id,
          period,
          quantity: 100 + i,
          marketplace_id: paginationMarketplace.id,
        });
        paginationRecords.push(record.id);
      }
    });

    afterAll(async () => {
      // Cleanup pagination test records
      for (const id of paginationRecords) {
        try {
          await ctx.client.salesHistory.delete(ctx.shopContext, id);
        } catch {
          // Ignore errors during cleanup
        }
      }
    });

    it('should return paginated response with metadata', async () => {
      const response = await ctx.client.salesHistory.getAll(ctx.shopContext);

      expect(response).toHaveProperty('items');
      expect(response).toHaveProperty('total');
      expect(response).toHaveProperty('limit');
      expect(response).toHaveProperty('offset');
      expect(Array.isArray(response.items)).toBe(true);
      expect(response.offset).toBe(0);
    });

    it('should respect custom limit and offset', async () => {
      const response = await ctx.client.salesHistory.getAll(ctx.shopContext, {
        limit: 5,
        offset: 3,
      });

      expect(response.items.length).toBeLessThanOrEqual(5);
      expect(response.limit).toBe(5);
      expect(response.offset).toBe(3);
    });

    it('should combine period filter with pagination', async () => {
      const response = await ctx.client.salesHistory.getAll(ctx.shopContext, {
        period_from: '2020-01',
        period_to: '2020-12',
        limit: 5,
        offset: 0,
      });

      expect(response.limit).toBe(5);
      expect(response.offset).toBe(0);
      expect(Array.isArray(response.items)).toBe(true);

      // All items should be within the period range
      response.items.forEach((r) => {
        expect(r.period >= '2020-01' && r.period <= '2020-12').toBe(true);
      });
    });

    it('should return correct total when filtering by period', async () => {
      const fullResponse = await ctx.client.salesHistory.getAll(ctx.shopContext, {
        period_from: '2020-01',
        period_to: '2020-12',
      });

      const paginatedResponse = await ctx.client.salesHistory.getAll(ctx.shopContext, {
        period_from: '2020-01',
        period_to: '2020-12',
        limit: 3,
      });

      // Total should be the same regardless of limit
      expect(paginatedResponse.total).toBe(fullResponse.total);
    });

    it('should paginate through filtered results correctly', async () => {
      const pageSize = 3;
      const allItems: number[] = [];
      let offset = 0;
      let total = 0;

      // Fetch all pages with period filter
      do {
        const response = await ctx.client.salesHistory.getAll(ctx.shopContext, {
          period_from: '2020-01',
          period_to: '2021-06',
          limit: pageSize,
          offset,
        });
        total = response.total;
        allItems.push(...response.items.map((r) => r.id));
        offset += pageSize;
      } while (allItems.length < total);

      // Verify we got all unique items
      const uniqueIds = new Set(allItems);
      expect(uniqueIds.size).toBe(total);
    });
  });

  describe('Delete operations', () => {
    it('should delete sales history', async () => {
      await ctx.client.salesHistory.delete(ctx.shopContext, salesHistoryId);
      await expectNotFound(() => ctx.client.salesHistory.getById(ctx.shopContext, salesHistoryId));
    });
  });

  describe('Tenant-based access control', () => {
    let otherCtx: TestContext;
    let otherSkuId: number;
    let otherMarketplaceId: number;

    beforeAll(async () => {
      otherCtx = await TestContext.create(app, baseUrl, {
        tenantTitle: `Other Tenant ${generateUniqueId()}`,
        userEmail: `other-tenant-${generateUniqueId()}@example.com`,
        userName: 'Other Tenant User',
      });

      const otherSku = await otherCtx.client.skus.create(otherCtx.shopContext, {
        code: generateTestCode('OTHER-SKU'),
        title: 'Other SKU',
      });
      otherSkuId = otherSku.id;

      const otherMarketplace = await otherCtx.client.marketplaces.create(otherCtx.shopContext, {
        code: generateTestCode('OTHER-MP'),
        title: 'Other Marketplace',
      });
      otherMarketplaceId = otherMarketplace.id;
    });

    afterAll(async () => {
      if (otherCtx) await otherCtx.dispose();
    });

    it('should return 403 when accessing other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.salesHistory.getAll({
          shop_id: otherCtx.shop.id,
          tenant_id: otherCtx.tenant.id,
        }),
      );
    });

    it('should return 403 when creating for other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.salesHistory.create(
          { shop_id: ctx.shop.id, tenant_id: otherCtx.tenant.id },
          {
            sku_id: skuId,
            period: generateTestPeriod(),
            quantity: 50,
            marketplace_id: marketplaceId,
          },
        ),
      );
    });

    it('should return 404 when getting resource from other tenant', async () => {
      const otherRecord = await otherCtx.client.salesHistory.create(otherCtx.shopContext, {
        sku_id: otherSkuId,
        period: generateTestPeriod(),
        quantity: 50,
        marketplace_id: otherMarketplaceId,
      });

      await expectNotFound(() => ctx.client.salesHistory.getById(ctx.shopContext, otherRecord.id));
    });
  });

  describe('Import/Export', () => {
    it('should import sales history from JSON', async () => {
      const marketplaceCode = generateTestCode('WB');
      const [period1, period2] = generateTestPeriodRange();

      const result = await ctx.client.salesHistory.importJson(ctx.shopContext, [
        { marketplace: marketplaceCode, period: period1, sku: skuCode, quantity: 80 },
        { marketplace: marketplaceCode, period: period2, sku: skuCode, quantity: 90 },
      ]);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('should upsert existing records on import', async () => {
      const marketplaceCode = generateTestCode('WB-UPSERT');
      const testPeriod = generateTestPeriod();

      await ctx.client.salesHistory.importJson(ctx.shopContext, [
        { marketplace: marketplaceCode, period: testPeriod, sku: skuCode, quantity: 80 },
      ]);

      const result = await ctx.client.salesHistory.importJson(ctx.shopContext, [
        { marketplace: marketplaceCode, period: testPeriod, sku: skuCode, quantity: 100 },
      ]);

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should auto-create missing SKUs on import', async () => {
      const newSkuCode = generateTestCode('AUTO-SKU');
      const normalizedSkuCode = normalizeSkuCode(newSkuCode);
      const marketplaceCode = generateTestCode('WB-AUTO');
      const testPeriod = generateTestPeriod();

      const result = await ctx.client.salesHistory.importJson(ctx.shopContext, [
        { marketplace: marketplaceCode, period: testPeriod, sku: newSkuCode, quantity: 50 },
      ]);

      expect(result.created).toBe(1);
      expect(result.skus_created).toBe(1);
      expect(result.errors).toEqual([]);

      const { items: skus } = await ctx.client.skus.getAll(ctx.shopContext);
      const createdSku = skus.find((s) => s.code === normalizedSkuCode);
      expect(createdSku).toBeDefined();
      expect(createdSku?.title).toBe(normalizedSkuCode);
    });

    it('should auto-create missing marketplaces on import', async () => {
      const uniqueSku = generateTestCode('SKU-MP-TEST');
      await ctx.client.skus.create(ctx.shopContext, {
        code: uniqueSku,
        title: 'Test SKU for MP auto-creation',
      });

      const uniqueMarketplace = generateTestCode('MP');
      const normalizedMarketplace = normalizeCode(uniqueMarketplace);
      const testPeriod = generateTestPeriod();

      const result = await ctx.client.salesHistory.importJson(ctx.shopContext, [
        { marketplace: uniqueMarketplace, period: testPeriod, sku: uniqueSku, quantity: 30 },
      ]);

      expect(result.created).toBe(1);
      expect(result.marketplaces_created).toBe(1);
      expect(result.errors).toEqual([]);

      const marketplaces = await ctx.client.marketplaces.getAll(ctx.shopContext);
      const createdMp = marketplaces.items.find((m) => m.code === normalizedMarketplace);
      expect(createdMp).toBeDefined();
      expect(createdMp?.title).toBe(normalizedMarketplace);
    });

    it('should import sales history from CSV', async () => {
      const csvSkuCode = generateTestCode('CSV-IMPORT');
      const normalizedSkuCode = normalizeSkuCode(csvSkuCode);
      const marketplaceCode = generateTestCode('WB-CSV');
      const normalizedMarketplace = normalizeCode(marketplaceCode);
      const testPeriod = generateTestPeriod();
      const csvContent = `marketplace,period,sku,quantity\n${marketplaceCode},${testPeriod},${csvSkuCode},75`;

      const result = await ctx.client.salesHistory.importCsv(ctx.shopContext, csvContent);

      expect(result).toHaveProperty('created');
      expect(result.created).toBeGreaterThanOrEqual(1);
      expect(result).toHaveProperty('skus_created');
      expect(result.skus_created).toBeGreaterThanOrEqual(1);

      const exported = await ctx.client.salesHistory.exportJson(ctx.shopContext, {
        period_from: testPeriod,
        period_to: testPeriod,
      });

      const imported = exported.find((r) => r.sku === normalizedSkuCode && r.period === testPeriod);
      expect(imported).toBeDefined();
      expect(imported?.quantity).toBe(75);
      expect(imported?.marketplace).toBe(normalizedMarketplace);
    });

    it('should export sales history to JSON', async () => {
      const exportSkuCode = generateTestCode('EXPORT-SH');
      const normalizedExportSkuCode = normalizeSkuCode(exportSkuCode);
      const marketplaceCode = generateTestCode('OZON');
      const normalizedMarketplace = normalizeCode(marketplaceCode);
      const testPeriod = generateTestPeriod();

      await ctx.client.skus.importJson(ctx.shopContext, [
        { code: exportSkuCode, title: 'Export Test SKU' },
      ]);

      await ctx.client.salesHistory.importJson(ctx.shopContext, [
        { marketplace: marketplaceCode, period: testPeriod, sku: exportSkuCode, quantity: 100 },
      ]);

      const exported = await ctx.client.salesHistory.exportJson(ctx.shopContext);

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

    it('should export with period filter', async () => {
      const testPeriod = generateTestPeriod();
      const exportSkuCode = generateTestCode('FILTER-TEST');
      const marketplaceCode = generateTestCode('MP-FILTER');

      await ctx.client.salesHistory.importJson(ctx.shopContext, [
        { marketplace: marketplaceCode, period: testPeriod, sku: exportSkuCode, quantity: 50 },
      ]);

      const exported = await ctx.client.salesHistory.exportJson(ctx.shopContext, {
        period_from: testPeriod,
        period_to: testPeriod,
      });

      expect(Array.isArray(exported)).toBe(true);

      const periods = exported.map((r) => r.period);
      expect(periods.every((p) => p === testPeriod)).toBe(true);
    });

    it('should export sales history to CSV', async () => {
      const csv = await ctx.client.salesHistory.exportCsv(ctx.shopContext);

      expect(csv).toBeTruthy();
      expect(typeof csv).toBe('string');

      const lines = csv.split('\n');
      expect(lines[0]).toBe('marketplace,period,sku,quantity');
      expect(lines.length).toBeGreaterThan(1);
    });

    it('should import sales history from CSV with semicolons', async () => {
      const csvSkuCode = generateTestCode('CSV-SEMI');
      const normalizedSkuCode = normalizeSkuCode(csvSkuCode);
      const marketplaceCode = generateTestCode('MP-SEMI');
      const testPeriod = generateTestPeriod();
      const csvContent = `marketplace;period;sku;quantity\n${marketplaceCode};${testPeriod};${csvSkuCode};85`;

      const result = await ctx.client.salesHistory.importCsv(ctx.shopContext, csvContent);

      expect(result).toHaveProperty('created');
      expect(result.created).toBeGreaterThanOrEqual(1);

      const exported = await ctx.client.salesHistory.exportJson(ctx.shopContext, {
        period_from: testPeriod,
        period_to: testPeriod,
      });

      const imported = exported.find((r) => r.sku === normalizedSkuCode && r.period === testPeriod);
      expect(imported).toBeDefined();
      expect(imported?.quantity).toBe(85);
    });

    it('should reject import with duplicate records (same sku+period+marketplace)', async () => {
      const skuCode = generateTestCode('DUP-SH');
      const marketplace = generateTestCode('DUP-MP');
      const testPeriod = generateTestPeriod();
      const csvContent = `marketplace,period,sku,quantity\n${marketplace},${testPeriod},${skuCode},10\n${marketplace},${testPeriod},${skuCode},20`;

      try {
        await ctx.client.salesHistory.importCsv(ctx.shopContext, csvContent);
        expect.fail('Expected ApiError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).message).toContain('Duplicate records');
      }
    });

    it('should reject JSON import with duplicate records', async () => {
      const skuCode = generateTestCode('DUP-SH-JSON');
      const marketplace = generateTestCode('DUP-MP-JSON');
      const testPeriod = generateTestPeriod();

      try {
        await ctx.client.salesHistory.importJson(ctx.shopContext, [
          { marketplace, period: testPeriod, sku: skuCode, quantity: 10 },
          { marketplace, period: testPeriod, sku: skuCode, quantity: 20 },
        ]);
        expect.fail('Expected ApiError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).message).toContain('Duplicate records');
      }
    });
  });

  describe('Example downloads', () => {
    it('should return JSON example', async () => {
      const example = await ctx.client.salesHistory.getExampleJson();

      expect(Array.isArray(example)).toBe(true);
      expect(example.length).toBeGreaterThan(0);
      expect(example[0]).toHaveProperty('marketplace');
      expect(example[0]).toHaveProperty('period');
      expect(example[0]).toHaveProperty('sku');
      expect(example[0]).toHaveProperty('quantity');
    });

    it('should return CSV example', async () => {
      const csv = await ctx.client.salesHistory.getExampleCsv();

      expect(csv).toContain('marketplace,period,sku,quantity');
      expect(csv).toContain('SKU-001');
    });
  });

  describe('Role-based access', () => {
    describe('Editor role', () => {
      let editorUserId: number;
      let editorClient: SalesPlannerClient;

      beforeAll(async () => {
        const editorUser = await ctx.getSystemClient().users.create({
          email: `editor-${generateUniqueId()}@example.com`,
          name: 'Editor User',
        });
        editorUserId = editorUser.id;

        const editorApiKey = await ctx.getSystemClient().apiKeys.create({
          user_id: editorUserId,
          name: 'Editor Key',
        });
        editorClient = new SalesPlannerClient({ baseUrl, apiKey: editorApiKey.key });

        const roles = await ctx.getSystemClient().roles.getAll();
        const editorRole = roles.items.find((r) => r.name === ROLE_NAMES.EDITOR);
        if (!editorRole) throw new Error('Editor role not found');
        await ctx.getSystemClient().userRoles.create({
          user_id: editorUserId,
          role_id: editorRole.id,
          tenant_id: ctx.tenant.id,
          shop_id: ctx.shop.id,
        });
      });

      afterAll(async () => {
        if (editorUserId) await cleanupUser(app, editorUserId);
      });

      it('editor should list sales history', async () => {
        const records = await editorClient.salesHistory.getAll(ctx.shopContext);
        expect(Array.isArray(records.items)).toBe(true);
      });

      it('editor should get sales history by id', async () => {
        const records = await editorClient.salesHistory.getAll(ctx.shopContext);
        if (records.items.length === 0) throw new Error('Expected at least one record for editor');
        const firstRecord = records.items[0];
        if (!firstRecord) throw new Error('Expected record');
        const record = await editorClient.salesHistory.getById(ctx.shopContext, firstRecord.id);
        expect(record.id).toBe(firstRecord.id);
      });

      it('editor should create sales history', async () => {
        const editorMp = await editorClient.marketplaces.create(ctx.shopContext, {
          code: generateTestCode('EDITOR-MP'),
          title: 'Editor Marketplace',
        });
        const editorSku = await editorClient.skus.create(ctx.shopContext, {
          code: generateTestCode('EDITOR-SKU'),
          title: 'Editor SKU',
        });

        const record = await editorClient.salesHistory.create(ctx.shopContext, {
          sku_id: editorSku.id,
          period: generateTestPeriod(),
          quantity: 50,
          marketplace_id: editorMp.id,
        });
        expect(record).toHaveProperty('id');
      });

      it('editor should update sales history', async () => {
        const records = await editorClient.salesHistory.getAll(ctx.shopContext);
        if (records.items.length > 0) {
          const firstRecord = records.items[0];
          if (!firstRecord) throw new Error('Expected record');
          const updated = await editorClient.salesHistory.update(ctx.shopContext, firstRecord.id, {
            quantity: 999,
          });
          expect(updated.quantity).toBe(999);
        }
      });

      it('editor should delete sales history', async () => {
        const editorMp = await editorClient.marketplaces.create(ctx.shopContext, {
          code: generateTestCode('EDITOR-DEL-MP'),
          title: 'Delete Test MP',
        });
        const editorSku = await editorClient.skus.create(ctx.shopContext, {
          code: generateTestCode('EDITOR-DEL-SKU'),
          title: 'Delete Test SKU',
        });
        const record = await editorClient.salesHistory.create(ctx.shopContext, {
          sku_id: editorSku.id,
          period: generateTestPeriod(),
          quantity: 10,
          marketplace_id: editorMp.id,
        });
        await editorClient.salesHistory.delete(ctx.shopContext, record.id);
        await expectNotFound(() => editorClient.salesHistory.getById(ctx.shopContext, record.id));
      });

      it('editor should import sales history', async () => {
        const result = await editorClient.salesHistory.importJson(ctx.shopContext, [
          {
            marketplace: generateTestCode('EDITOR-IMP'),
            period: generateTestPeriod(),
            sku: skuCode,
            quantity: 20,
          },
        ]);
        expect(result.created).toBe(1);
      });

      it('editor should export sales history', async () => {
        const exported = await editorClient.salesHistory.exportJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });
    });

    describe('Viewer role', () => {
      let viewerUserId: number;
      let viewerClient: SalesPlannerClient;
      let testRecordId: number;

      beforeAll(async () => {
        const viewerUser = await ctx.getSystemClient().users.create({
          email: `viewer-${generateUniqueId()}@example.com`,
          name: 'Viewer User',
        });
        viewerUserId = viewerUser.id;

        const viewerApiKey = await ctx.getSystemClient().apiKeys.create({
          user_id: viewerUserId,
          name: 'Viewer Key',
        });
        viewerClient = new SalesPlannerClient({ baseUrl, apiKey: viewerApiKey.key });

        const roles = await ctx.getSystemClient().roles.getAll();
        const viewerRole = roles.items.find((r) => r.name === ROLE_NAMES.VIEWER);
        if (!viewerRole) throw new Error('Viewer role not found');
        await ctx.getSystemClient().userRoles.create({
          user_id: viewerUserId,
          role_id: viewerRole.id,
          tenant_id: ctx.tenant.id,
          shop_id: ctx.shop.id,
        });

        // Create a test record for viewer tests
        const viewerMp = await ctx.client.marketplaces.create(ctx.shopContext, {
          code: generateTestCode('VIEWER-MP'),
          title: 'Viewer Test MP',
        });
        const viewerSku = await ctx.client.skus.create(ctx.shopContext, {
          code: generateTestCode('VIEWER-SKU'),
          title: 'Viewer Test SKU',
        });
        const record = await ctx.client.salesHistory.create(ctx.shopContext, {
          sku_id: viewerSku.id,
          period: generateTestPeriod(),
          quantity: 25,
          marketplace_id: viewerMp.id,
        });
        testRecordId = record.id;
      });

      afterAll(async () => {
        if (viewerUserId) await cleanupUser(app, viewerUserId);
      });

      it('viewer should list sales history', async () => {
        const records = await viewerClient.salesHistory.getAll(ctx.shopContext);
        expect(Array.isArray(records.items)).toBe(true);
      });

      it('viewer should get sales history by id', async () => {
        const record = await viewerClient.salesHistory.getById(ctx.shopContext, testRecordId);
        expect(record.id).toBe(testRecordId);
      });

      it('viewer should NOT create sales history', async () => {
        await expectForbidden(() =>
          viewerClient.salesHistory.create(ctx.shopContext, {
            sku_id: skuId,
            period: generateTestPeriod(),
            quantity: 50,
            marketplace_id: marketplaceId,
          }),
        );
      });

      it('viewer should NOT update sales history', async () => {
        await expectForbidden(() =>
          viewerClient.salesHistory.update(ctx.shopContext, testRecordId, {
            quantity: 999,
          }),
        );
      });

      it('viewer should NOT delete sales history', async () => {
        await expectForbidden(() =>
          viewerClient.salesHistory.delete(ctx.shopContext, testRecordId),
        );
      });

      it('viewer should export sales history', async () => {
        const exported = await viewerClient.salesHistory.exportJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('viewer should NOT import sales history', async () => {
        await expectForbidden(() =>
          viewerClient.salesHistory.importJson(ctx.shopContext, [
            { marketplace: 'test', period: '2026-01', sku: 'test', quantity: 10 },
          ]),
        );
      });
    });
  });
});
