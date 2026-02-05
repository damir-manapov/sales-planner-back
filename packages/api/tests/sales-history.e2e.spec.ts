import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
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
    const sku = await ctx.client.skus.createSku(
      { code: skuCode, title: 'Test SKU for Sales' },
      ctx.shopContext,
    );
    skuId = sku.id;

    // Create a test marketplace
    const marketplace = await ctx.client.marketplaces.createMarketplace(
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
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.salesHistory.getSalesHistory(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.salesHistory.getSalesHistory(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create sales history record', async () => {
      const testPeriod = generateTestPeriod();
      const record = await ctx.client.salesHistory.createSalesHistory(
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

    it('should list sales history', async () => {
      const records = await ctx.client.salesHistory.getSalesHistory(ctx.shopContext);

      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThan(0);
    });

    it('should filter by period range', async () => {
      const [periodFrom, periodTo] = generateTestPeriodRange();

      const rangeTestMarketplace = await ctx.client.marketplaces.createMarketplace(
        { code: generateTestCode('MP-RANGE'), title: 'Range Test MP' },
        ctx.shopContext,
      );

      await ctx.client.salesHistory.createSalesHistory(
        {
          sku_id: skuId,
          period: periodFrom,
          quantity: 50,
          marketplace_id: rangeTestMarketplace.id,
        },
        ctx.shopContext,
      );
      await ctx.client.salesHistory.createSalesHistory(
        { sku_id: skuId, period: periodTo, quantity: 60, marketplace_id: rangeTestMarketplace.id },
        ctx.shopContext,
      );

      const records = await ctx.client.salesHistory.getSalesHistory(ctx.shopContext, {
        period_from: periodFrom,
        period_to: periodTo,
      });

      expect(Array.isArray(records)).toBe(true);
      records.forEach((r) => {
        expect(r.period >= periodFrom && r.period <= periodTo).toBe(true);
      });
    });

    it('should get sales history by id', async () => {
      const record = await ctx.client.salesHistory.getSalesHistoryItem(salesHistoryId, ctx.shopContext);

      expect(record.id).toBe(salesHistoryId);
    });

    it('should update sales history', async () => {
      const record = await ctx.client.salesHistory.updateSalesHistory(
        salesHistoryId,
        { quantity: 150 },
        ctx.shopContext,
      );

      expect(record.quantity).toBe(150);
    });

    it('should reject invalid period format', async () => {
      await expectApiError(
        () =>
          ctx.client.salesHistory.createSalesHistory(
            { sku_id: skuId, period: '2026-13', quantity: 50, marketplace_id: marketplaceId },
            ctx.shopContext,
          ),
        400,
      );
    });

    it('should reject invalid period string', async () => {
      await expectApiError(
        () =>
          ctx.client.salesHistory.createSalesHistory(
            { sku_id: skuId, period: '2026-1', quantity: 50, marketplace_id: marketplaceId },
            ctx.shopContext,
          ),
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

      await ctx.client.salesHistory.createSalesHistory(duplicateEntry, ctx.shopContext);

      await expectConflict(() => ctx.client.salesHistory.createSalesHistory(duplicateEntry, ctx.shopContext));
    });

    it('should return 404 for non-existent record', async () => {
      await expectNotFound(() => ctx.client.salesHistory.getSalesHistoryItem(999999, ctx.shopContext));
    });
  });

  describe('Delete operations', () => {
    it('should delete sales history', async () => {
      await ctx.client.salesHistory.deleteSalesHistory(salesHistoryId, ctx.shopContext);
      await expectNotFound(() => ctx.client.salesHistory.getSalesHistoryItem(salesHistoryId, ctx.shopContext));
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

      const otherSku = await otherCtx.client.skus.createSku(
        { code: generateTestCode('OTHER-SKU'), title: 'Other SKU' },
        otherCtx.shopContext,
      );
      otherSkuId = otherSku.id;

      const otherMarketplace = await otherCtx.client.marketplaces.createMarketplace(
        { code: generateTestCode('OTHER-MP'), title: 'Other Marketplace' },
        otherCtx.shopContext,
      );
      otherMarketplaceId = otherMarketplace.id;
    });

    afterAll(async () => {
      if (otherCtx) await otherCtx.dispose();
    });

    it('should return 403 when accessing other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.salesHistory.getSalesHistory({
          shop_id: otherCtx.shop.id,
          tenant_id: otherCtx.tenant.id,
        }),
      );
    });

    it('should return 403 when creating for other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.salesHistory.createSalesHistory(
          {
            sku_id: skuId,
            period: generateTestPeriod(),
            quantity: 50,
            marketplace_id: marketplaceId,
          },
          { shop_id: ctx.shop.id, tenant_id: otherCtx.tenant.id },
        ),
      );
    });

    it('should return 404 when getting resource from other tenant', async () => {
      const otherRecord = await otherCtx.client.salesHistory.createSalesHistory(
        {
          sku_id: otherSkuId,
          period: generateTestPeriod(),
          quantity: 50,
          marketplace_id: otherMarketplaceId,
        },
        otherCtx.shopContext,
      );

      await expectNotFound(() => ctx.client.salesHistory.getSalesHistoryItem(otherRecord.id, ctx.shopContext));
    });
  });

  describe('Import/Export', () => {
    it('should import sales history from JSON', async () => {
      const marketplaceCode = generateTestCode('WB');
      const [period1, period2] = generateTestPeriodRange();

      const result = await ctx.client.salesHistory.importJson(
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

    it('should upsert existing records on import', async () => {
      const marketplaceCode = generateTestCode('WB-UPSERT');
      const testPeriod = generateTestPeriod();

      await ctx.client.salesHistory.importJson(
        [{ marketplace: marketplaceCode, period: testPeriod, sku: skuCode, quantity: 80 }],
        ctx.shopContext,
      );

      const result = await ctx.client.salesHistory.importJson(
        [{ marketplace: marketplaceCode, period: testPeriod, sku: skuCode, quantity: 100 }],
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should auto-create missing SKUs on import', async () => {
      const newSkuCode = generateTestCode('AUTO-SKU');
      const normalizedSkuCode = normalizeSkuCode(newSkuCode);
      const marketplaceCode = generateTestCode('WB-AUTO');
      const testPeriod = generateTestPeriod();

      const result = await ctx.client.salesHistory.importJson(
        [{ marketplace: marketplaceCode, period: testPeriod, sku: newSkuCode, quantity: 50 }],
        ctx.shopContext,
      );

      expect(result.created).toBe(1);
      expect(result.skus_created).toBe(1);
      expect(result.errors).toEqual([]);

      const skus = await ctx.client.skus.getSkus(ctx.shopContext);
      const createdSku = skus.find((s) => s.code === normalizedSkuCode);
      expect(createdSku).toBeDefined();
      expect(createdSku?.title).toBe(normalizedSkuCode);
    });

    it('should auto-create missing marketplaces on import', async () => {
      const uniqueSku = generateTestCode('SKU-MP-TEST');
      await ctx.client.skus.createSku(
        { code: uniqueSku, title: 'Test SKU for MP auto-creation' },
        ctx.shopContext,
      );

      const uniqueMarketplace = generateTestCode('MP');
      const normalizedMarketplace = normalizeCode(uniqueMarketplace);
      const testPeriod = generateTestPeriod();

      const result = await ctx.client.salesHistory.importJson(
        [{ marketplace: uniqueMarketplace, period: testPeriod, sku: uniqueSku, quantity: 30 }],
        ctx.shopContext,
      );

      expect(result.created).toBe(1);
      expect(result.marketplaces_created).toBe(1);
      expect(result.errors).toEqual([]);

      const marketplaces = await ctx.client.marketplaces.getMarketplaces(ctx.shopContext);
      const createdMp = marketplaces.find((m) => m.code === normalizedMarketplace);
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

      const result = await ctx.client.salesHistory.importCsv(csvContent, ctx.shopContext);

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

      await ctx.client.skus.importJson(
        [{ code: exportSkuCode, title: 'Export Test SKU' }],
        ctx.shopContext,
      );

      await ctx.client.salesHistory.importJson(
        [{ marketplace: marketplaceCode, period: testPeriod, sku: exportSkuCode, quantity: 100 }],
        ctx.shopContext,
      );

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

      await ctx.client.salesHistory.importJson(
        [{ marketplace: marketplaceCode, period: testPeriod, sku: exportSkuCode, quantity: 50 }],
        ctx.shopContext,
      );

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

      const result = await ctx.client.salesHistory.importCsv(csvContent, ctx.shopContext);

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
        const editorUser = await ctx.getSystemClient().createUser({
          email: `editor-${generateUniqueId()}@example.com`,
          name: 'Editor User',
        });
        editorUserId = editorUser.id;

        const editorApiKey = await ctx.getSystemClient().createApiKey({
          user_id: editorUserId,
          name: 'Editor Key',
        });
        editorClient = new SalesPlannerClient({ baseUrl, apiKey: editorApiKey.key });

        const roles = await ctx.getSystemClient().getRoles();
        const editorRole = roles.find((r) => r.name === ROLE_NAMES.EDITOR);
        if (!editorRole) throw new Error('Editor role not found');
          await ctx.getSystemClient().userRoles.createUserRole({
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
        const records = await editorClient.salesHistory.getSalesHistory(ctx.shopContext);
        expect(Array.isArray(records)).toBe(true);
      });

      it('editor should get sales history by id', async () => {
        const records = await editorClient.salesHistory.getSalesHistory(ctx.shopContext);
        if (records.length === 0) throw new Error('Expected at least one record for editor');
        const firstRecord = records[0];
        if (!firstRecord) throw new Error('Expected record');
        const record = await editorClient.salesHistory.getSalesHistoryItem(firstRecord.id, ctx.shopContext);
        expect(record.id).toBe(firstRecord.id);
      });

      it('editor should create sales history', async () => {
        const editorMp = await editorClient.marketplaces.createMarketplace(
          { code: generateTestCode('EDITOR-MP'), title: 'Editor Marketplace' },
          ctx.shopContext,
        );
        const editorSku = await editorClient.skus.createSku(
          { code: generateTestCode('EDITOR-SKU'), title: 'Editor SKU' },
          ctx.shopContext,
        );

        const record = await editorClient.salesHistory.createSalesHistory(
          {
            sku_id: editorSku.id,
            period: generateTestPeriod(),
            quantity: 50,
            marketplace_id: editorMp.id,
          },
          ctx.shopContext,
        );
        expect(record).toHaveProperty('id');
      });

      it('editor should update sales history', async () => {
        const records = await editorClient.salesHistory.getSalesHistory(ctx.shopContext);
        if (records.length > 0) {
          const firstRecord = records[0];
          if (!firstRecord) throw new Error('Expected record');
          const updated = await editorClient.salesHistory.updateSalesHistory(
            firstRecord.id,
            { quantity: 999 },
            ctx.shopContext,
          );
          expect(updated.quantity).toBe(999);
        }
      });

      it('editor should delete sales history', async () => {
        const editorMp = await editorClient.marketplaces.createMarketplace(
          { code: generateTestCode('EDITOR-DEL-MP'), title: 'Delete Test MP' },
          ctx.shopContext,
        );
        const editorSku = await editorClient.skus.createSku(
          { code: generateTestCode('EDITOR-DEL-SKU'), title: 'Delete Test SKU' },
          ctx.shopContext,
        );
        const record = await editorClient.salesHistory.createSalesHistory(
          {
            sku_id: editorSku.id,
            period: generateTestPeriod(),
            quantity: 10,
            marketplace_id: editorMp.id,
          },
          ctx.shopContext,
        );
        await editorClient.salesHistory.deleteSalesHistory(record.id, ctx.shopContext);
        await expectNotFound(() => editorClient.salesHistory.getSalesHistoryItem(record.id, ctx.shopContext));
      });

      it('editor should import sales history', async () => {
        const result = await editorClient.salesHistory.importJson(
          [
            {
              marketplace: generateTestCode('EDITOR-IMP'),
              period: generateTestPeriod(),
              sku: skuCode,
              quantity: 20,
            },
          ],
          ctx.shopContext,
        );
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
        const viewerUser = await ctx.getSystemClient().createUser({
          email: `viewer-${generateUniqueId()}@example.com`,
          name: 'Viewer User',
        });
        viewerUserId = viewerUser.id;

        const viewerApiKey = await ctx.getSystemClient().createApiKey({
          user_id: viewerUserId,
          name: 'Viewer Key',
        });
        viewerClient = new SalesPlannerClient({ baseUrl, apiKey: viewerApiKey.key });

        const roles = await ctx.getSystemClient().getRoles();
        const viewerRole = roles.find((r) => r.name === ROLE_NAMES.VIEWER);
        if (!viewerRole) throw new Error('Viewer role not found');
          await ctx.getSystemClient().userRoles.createUserRole({
            user_id: viewerUserId,
            role_id: viewerRole.id,
            tenant_id: ctx.tenant.id,
            shop_id: ctx.shop.id,
          });

        // Create a test record for viewer tests
        const viewerMp = await ctx.client.marketplaces.createMarketplace(
          { code: generateTestCode('VIEWER-MP'), title: 'Viewer Test MP' },
          ctx.shopContext,
        );
        const viewerSku = await ctx.client.skus.createSku(
          { code: generateTestCode('VIEWER-SKU'), title: 'Viewer Test SKU' },
          ctx.shopContext,
        );
        const record = await ctx.client.salesHistory.createSalesHistory(
          {
            sku_id: viewerSku.id,
            period: generateTestPeriod(),
            quantity: 25,
            marketplace_id: viewerMp.id,
          },
          ctx.shopContext,
        );
        testRecordId = record.id;
      });

      afterAll(async () => {
        if (viewerUserId) await cleanupUser(app, viewerUserId);
      });

      it('viewer should list sales history', async () => {
        const records = await viewerClient.salesHistory.getSalesHistory(ctx.shopContext);
        expect(Array.isArray(records)).toBe(true);
      });

      it('viewer should get sales history by id', async () => {
        const record = await viewerClient.salesHistory.getSalesHistoryItem(testRecordId, ctx.shopContext);
        expect(record.id).toBe(testRecordId);
      });

      it('viewer should NOT create sales history', async () => {
        await expectForbidden(() =>
          viewerClient.salesHistory.createSalesHistory(
            {
              sku_id: skuId,
              period: generateTestPeriod(),
              quantity: 50,
              marketplace_id: marketplaceId,
            },
            ctx.shopContext,
          ),
        );
      });

      it('viewer should NOT update sales history', async () => {
        await expectForbidden(() =>
          viewerClient.salesHistory.updateSalesHistory(testRecordId, { quantity: 999 }, ctx.shopContext),
        );
      });

      it('viewer should NOT delete sales history', async () => {
        await expectForbidden(() => viewerClient.salesHistory.deleteSalesHistory(testRecordId, ctx.shopContext));
      });

      it('viewer should export sales history', async () => {
        const exported = await viewerClient.salesHistory.exportJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('viewer should NOT import sales history', async () => {
        await expectForbidden(() =>
          viewerClient.salesHistory.importJson(
            [{ marketplace: 'test', period: '2026-01', sku: 'test', quantity: 10 }],
            ctx.shopContext,
          ),
        );
      });
    });
  });
});
