import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { TestContext } from './test-context.js';
import {
  expectConflict,
  expectUnauthorized,
  generateTestCode,
  generateUniqueId,
} from './test-helpers.js';

describe('Competitor Sales (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let competitorProductId: number;
  let saleId: number;

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
      userEmail: `competitor-sale-test-${generateUniqueId()}@example.com`,
      userName: 'Competitor Sale Test User',
    });

    // Create test marketplace
    const marketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
      code: generateTestCode('MP-CSALE'),
      title: 'Test Marketplace for Sales',
    });

    // Create test competitor product
    const competitorProduct = await ctx.client.competitorProducts.create(ctx.shopContext, {
      marketplace_id: marketplace.id,
      marketplace_product_id: '123456789',
      title: 'Test Competitor Product',
      brand: 'Test Brand',
    });
    competitorProductId = competitorProduct.id;
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.competitorSales.getAll(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.competitorSales.getAll(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    const testPeriod = '2024-01';

    it('should create competitor sale', async () => {
      const record = await ctx.client.competitorSales.create(ctx.shopContext, {
        competitor_product_id: competitorProductId,
        period: testPeriod,
        quantity: 100,
      });

      expect(record).toHaveProperty('id');
      expect(record.competitor_product_id).toBe(competitorProductId);
      expect(record.period).toBe(testPeriod);
      expect(record.quantity).toBe(100);
      expect(record.shop_id).toBe(ctx.shop.id);
      expect(record.tenant_id).toBe(ctx.tenant.id);

      saleId = record.id;
    });

    it('should list competitor sales', async () => {
      const records = await ctx.client.competitorSales.getAll(ctx.shopContext);

      expect(Array.isArray(records.items)).toBe(true);
      expect(records.items.length).toBeGreaterThan(0);
    });

    it('should get competitor sale by id', async () => {
      const record = await ctx.client.competitorSales.getById(ctx.shopContext, saleId);

      expect(record.id).toBe(saleId);
    });

    it('should update competitor sale', async () => {
      const record = await ctx.client.competitorSales.update(ctx.shopContext, saleId, {
        quantity: 200,
      });

      expect(record.quantity).toBe(200);
    });

    it('should return 409 on duplicate (competitor_product_id, period)', async () => {
      // Create another competitor product for duplicate test
      const marketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
        code: generateTestCode('MP-DUP'),
        title: 'Dup Test MP',
      });
      const dupCompetitorProduct = await ctx.client.competitorProducts.create(ctx.shopContext, {
        marketplace_id: marketplace.id,
        marketplace_product_id: '999888777',
        title: 'Dup Test Product',
      });

      await ctx.client.competitorSales.create(ctx.shopContext, {
        competitor_product_id: dupCompetitorProduct.id,
        period: '2024-02',
        quantity: 50,
      });

      await expectConflict(() =>
        ctx.client.competitorSales.create(ctx.shopContext, {
          competitor_product_id: dupCompetitorProduct.id,
          period: '2024-02',
          quantity: 75,
        }),
      );
    });

    it('should delete competitor sale', async () => {
      const marketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
        code: generateTestCode('MP-SDEL'),
        title: 'Del Test MP',
      });
      const delCompetitorProduct = await ctx.client.competitorProducts.create(ctx.shopContext, {
        marketplace_id: marketplace.id,
        marketplace_product_id: '111222333',
        title: 'Del Test Product',
      });

      const record = await ctx.client.competitorSales.create(ctx.shopContext, {
        competitor_product_id: delCompetitorProduct.id,
        period: '2024-03',
        quantity: 30,
      });

      await ctx.client.competitorSales.delete(ctx.shopContext, record.id);

      // Verify deletion
      try {
        await ctx.client.competitorSales.getById(ctx.shopContext, record.id);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as { status: number }).status).toBe(404);
      }
    });
  });

  describe('Period filtering', () => {
    it('should filter by period_from', async () => {
      const records = await ctx.client.competitorSales.getAll(ctx.shopContext, {
        period_from: '2024-01',
      });

      expect(Array.isArray(records.items)).toBe(true);
      for (const record of records.items) {
        expect(record.period >= '2024-01').toBe(true);
      }
    });

    it('should filter by period_to', async () => {
      const records = await ctx.client.competitorSales.getAll(ctx.shopContext, {
        period_to: '2024-12',
      });

      expect(Array.isArray(records.items)).toBe(true);
      for (const record of records.items) {
        expect(record.period <= '2024-12').toBe(true);
      }
    });

    it('should filter by period range', async () => {
      const records = await ctx.client.competitorSales.getAll(ctx.shopContext, {
        period_from: '2024-01',
        period_to: '2024-06',
      });

      expect(Array.isArray(records.items)).toBe(true);
      for (const record of records.items) {
        expect(record.period >= '2024-01').toBe(true);
        expect(record.period <= '2024-06').toBe(true);
      }
    });
  });

  describe('Import/Export', () => {
    it('should import competitor sales from JSON (auto-creates competitor products)', async () => {
      const importMarketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
        code: generateTestCode('MP-CIMP'),
        title: 'Import Test MP',
      });

      const result = await ctx.client.competitorSales.importJson(ctx.shopContext, [
        {
          marketplace: importMarketplace.code,
          marketplaceProductId: '444555666',
          period: '2024-04',
          quantity: 150,
        },
      ]);

      expect(result.created).toBe(1);
    });

    it('should export competitor sales to JSON', async () => {
      const items = await ctx.client.competitorSales.exportJson(ctx.shopContext);

      expect(Array.isArray(items)).toBe(true);
      if (items.length > 0) {
        expect(items[0]).toHaveProperty('marketplace');
        expect(items[0]).toHaveProperty('marketplace_product_id');
        expect(items[0]).toHaveProperty('period');
        expect(items[0]).toHaveProperty('quantity');
      }
    });

    it('should import competitor sales from CSV', async () => {
      const csvMarketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
        code: generateTestCode('MP-CCSV'),
        title: 'CSV Test MP',
      });

      const csv = `marketplace;marketplaceProductId;period;quantity
${csvMarketplace.code};777888999;2024-05;250`;

      const result = await ctx.client.competitorSales.importCsv(ctx.shopContext, csv);

      expect(result.created).toBe(1);
    });

    it('should export competitor sales to CSV', async () => {
      const csv = await ctx.client.competitorSales.exportCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('marketplace');
      expect(csv).toContain('marketplace_product_id');
      expect(csv).toContain('period');
      expect(csv).toContain('quantity');
    });

    it('should auto-create missing marketplaces on import', async () => {
      // Get initial count
      const marketplacesBefore = await ctx.client.marketplaces.getAll(ctx.shopContext);
      const countBefore = marketplacesBefore.total;

      const mpCode = `newmp${generateUniqueId()}`;
      const result = await ctx.client.competitorSales.importJson(ctx.shopContext, [
        {
          marketplace: mpCode,
          marketplaceProductId: '999888777',
          period: '2024-06',
          quantity: 300,
        },
      ]);

      expect(result.created).toBe(1);

      // Verify auto-created marketplace exists with correct data
      const marketplacesAfter = await ctx.client.marketplaces.getAll(ctx.shopContext);
      expect(marketplacesAfter.total).toBe(countBefore + 1);

      const newMarketplace = marketplacesAfter.items.find(
        (m) => !marketplacesBefore.items.some((b) => b.id === m.id),
      );
      expect(newMarketplace).toBeDefined();
      // Code is normalized, title defaults to normalized code
      expect(newMarketplace!.code).toContain('newmp');
      expect(newMarketplace!.title).toBe(newMarketplace!.code);
    });

    it('should auto-create competitor products with title defaulting to marketplace_product_id', async () => {
      // Get initial count
      const competitorProductsBefore = await ctx.client.competitorProducts.getAll(ctx.shopContext);
      const countBefore = competitorProductsBefore.total;

      // marketplace_product_id is BIGINT, use numeric string
      const marketplaceProductId = String(Date.now());
      const result = await ctx.client.competitorSales.importJson(ctx.shopContext, [
        {
          marketplace: `automp${generateUniqueId()}`,
          marketplaceProductId,
          period: '2024-07',
          quantity: 100,
        },
      ]);

      expect(result.created).toBe(1);

      // Verify auto-created competitor product exists with correct data
      const competitorProductsAfter = await ctx.client.competitorProducts.getAll(ctx.shopContext);
      expect(competitorProductsAfter.total).toBe(countBefore + 1);

      const newProduct = competitorProductsAfter.items.find(
        (p) => !competitorProductsBefore.items.some((b) => b.id === p.id),
      );
      expect(newProduct).toBeDefined();
      expect(newProduct!.marketplace_product_id).toBe(marketplaceProductId);
      // Title defaults to marketplace_product_id
      expect(newProduct!.title).toBe(marketplaceProductId);
    });
  });
});
