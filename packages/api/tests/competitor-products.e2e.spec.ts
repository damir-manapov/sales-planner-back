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

describe('Competitor Products (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let marketplaceId: number;
  let productId: number;

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
      userEmail: `competitor-product-test-${generateUniqueId()}@example.com`,
      userName: 'Competitor Product Test User',
    });

    // Create test marketplace
    const marketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
      code: generateTestCode('MP-CP'),
      title: 'Test Marketplace',
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
      await expectUnauthorized(() => noAuthClient.competitorProducts.getAll(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.competitorProducts.getAll(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create competitor product', async () => {
      const record = await ctx.client.competitorProducts.create(ctx.shopContext, {
        marketplace_id: marketplaceId,
        marketplace_product_id: '123456789',
        title: 'Test Product',
        brand: 'Test Brand',
      });

      expect(record).toHaveProperty('id');
      expect(record.marketplace_id).toBe(marketplaceId);
      expect(record.marketplace_product_id).toBe('123456789');
      expect(record.title).toBe('Test Product');
      expect(record.brand).toBe('Test Brand');
      expect(record.shop_id).toBe(ctx.shop.id);
      expect(record.tenant_id).toBe(ctx.tenant.id);

      productId = record.id;
    });

    it('should list competitor products', async () => {
      const records = await ctx.client.competitorProducts.getAll(ctx.shopContext);

      expect(Array.isArray(records.items)).toBe(true);
      expect(records.items.length).toBeGreaterThan(0);
    });

    it('should get competitor product by id', async () => {
      const record = await ctx.client.competitorProducts.getById(ctx.shopContext, productId);

      expect(record.id).toBe(productId);
    });

    it('should update competitor product', async () => {
      const record = await ctx.client.competitorProducts.update(ctx.shopContext, productId, {
        title: 'Updated Title',
        brand: 'Updated Brand',
      });

      expect(record.title).toBe('Updated Title');
      expect(record.brand).toBe('Updated Brand');
    });

    it('should return 409 on duplicate (marketplace_id, marketplace_product_id)', async () => {
      await expectConflict(() =>
        ctx.client.competitorProducts.create(ctx.shopContext, {
          marketplace_id: marketplaceId,
          marketplace_product_id: '123456789',
          title: 'Duplicate',
        }),
      );
    });

    it('should delete competitor product', async () => {
      const marketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
        code: generateTestCode('MP-DEL'),
        title: 'Delete Test MP',
      });

      const record = await ctx.client.competitorProducts.create(ctx.shopContext, {
        marketplace_id: marketplace.id,
        marketplace_product_id: '999888777',
      });

      await ctx.client.competitorProducts.delete(ctx.shopContext, record.id);

      // Verify deletion
      try {
        await ctx.client.competitorProducts.getById(ctx.shopContext, record.id);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as { status: number }).status).toBe(404);
      }
    });
  });

  describe('Import/Export', () => {
    it('should import competitor products from JSON', async () => {
      const importMarketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
        code: generateTestCode('MP-IMP'),
        title: 'Import Test MP',
      });

      const result = await ctx.client.competitorProducts.importJson(ctx.shopContext, [
        {
          marketplace: importMarketplace.code,
          marketplaceProductId: '444555666',
          title: 'Imported Product',
          brand: 'Imported Brand',
        },
      ]);

      expect(result.created).toBe(1);
    });

    it('should export competitor products to JSON', async () => {
      const items = await ctx.client.competitorProducts.exportJson(ctx.shopContext);

      expect(Array.isArray(items)).toBe(true);
      if (items.length > 0) {
        expect(items[0]).toHaveProperty('marketplace');
        expect(items[0]).toHaveProperty('marketplace_product_id');
      }
    });

    it('should import competitor products from CSV', async () => {
      const csvMarketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
        code: generateTestCode('MP-CSV'),
        title: 'CSV Test MP',
      });

      const csv = `marketplace;marketplaceProductId;title;brand
${csvMarketplace.code};777888999;CSV Product;CSV Brand`;

      const result = await ctx.client.competitorProducts.importCsv(ctx.shopContext, csv);

      expect(result.created).toBe(1);
    });

    it('should export competitor products to CSV', async () => {
      const csv = await ctx.client.competitorProducts.exportCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('marketplace');
      expect(csv).toContain('marketplace_product_id');
    });

    it('should auto-create missing marketplaces on import', async () => {
      // Get initial count
      const marketplacesBefore = await ctx.client.marketplaces.getAll(ctx.shopContext);
      const countBefore = marketplacesBefore.total;

      const mpCode = `newmp${generateUniqueId()}`;
      const result = await ctx.client.competitorProducts.importJson(ctx.shopContext, [
        {
          marketplace: mpCode,
          marketplaceProductId: '999888777',
          title: 'Auto MP Product',
          brand: 'Auto Brand',
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
      expect(newMarketplace?.code).toContain('newmp');
      expect(newMarketplace?.title).toBe(newMarketplace?.code);
    });
  });

  describe('Optional fields', () => {
    it('should create competitor product without title and brand', async () => {
      const marketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
        code: generateTestCode('MP-OPT'),
        title: 'Optional Test MP',
      });

      const record = await ctx.client.competitorProducts.create(ctx.shopContext, {
        marketplace_id: marketplace.id,
        marketplace_product_id: '111222333',
      });

      expect(record.title).toBeNull();
      expect(record.brand).toBeNull();
    });
  });
});
