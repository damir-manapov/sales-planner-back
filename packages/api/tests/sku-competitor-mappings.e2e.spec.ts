import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { TestContext } from './test-context.js';
import { expectUnauthorized, generateTestCode, generateUniqueId } from './test-helpers.js';

describe('SKU Competitor Mappings (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let skuId: number;
  let competitorProductId: number;
  let mappingId: number;

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
      userEmail: `mapping-test-${generateUniqueId()}@example.com`,
      userName: 'Mapping Test User',
    });

    // Create test SKU
    const sku = await ctx.client.skus.create(ctx.shopContext, {
      code: generateTestCode('SKU-MAP'),
      title: 'Test SKU for Mapping',
    });
    skuId = sku.id;

    // Create test marketplace
    const marketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
      code: generateTestCode('MP-MAP'),
      title: 'Test Marketplace',
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
      await expectUnauthorized(() => noAuthClient.skuCompetitorMappings.getAll(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.skuCompetitorMappings.getAll(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create SKU competitor mapping', async () => {
      const record = await ctx.client.skuCompetitorMappings.create(ctx.shopContext, {
        sku_id: skuId,
        competitor_product_id: competitorProductId,
      });

      expect(record).toHaveProperty('id');
      expect(record.sku_id).toBe(skuId);
      expect(record.competitor_product_id).toBe(competitorProductId);
      expect(record.shop_id).toBe(ctx.shop.id);
      expect(record.tenant_id).toBe(ctx.tenant.id);

      mappingId = record.id;
    });

    it('should list SKU competitor mappings', async () => {
      const records = await ctx.client.skuCompetitorMappings.getAll(ctx.shopContext);

      expect(Array.isArray(records.items)).toBe(true);
      expect(records.items.length).toBeGreaterThan(0);
    });

    it('should get SKU competitor mapping by id', async () => {
      const record = await ctx.client.skuCompetitorMappings.getById(ctx.shopContext, mappingId);

      expect(record.id).toBe(mappingId);
    });

    it('should update SKU competitor mapping', async () => {
      // Create another competitor product for update test
      const marketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
        code: generateTestCode('MP-UPD'),
        title: 'Update Test Marketplace',
      });
      const newCompetitorProduct = await ctx.client.competitorProducts.create(ctx.shopContext, {
        marketplace_id: marketplace.id,
        marketplace_product_id: '987654321',
        title: 'New Competitor Product',
      });

      const record = await ctx.client.skuCompetitorMappings.update(ctx.shopContext, mappingId, {
        competitor_product_id: newCompetitorProduct.id,
      });

      expect(record.competitor_product_id).toBe(newCompetitorProduct.id);
    });

    it('should delete SKU competitor mapping', async () => {
      const deleteSku = await ctx.client.skus.create(ctx.shopContext, {
        code: generateTestCode('SKU-DEL'),
        title: 'Delete Test SKU',
      });

      const marketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
        code: generateTestCode('MP-DEL'),
        title: 'Delete Test MP',
      });
      const delCompetitorProduct = await ctx.client.competitorProducts.create(ctx.shopContext, {
        marketplace_id: marketplace.id,
        marketplace_product_id: '111222333',
      });

      const record = await ctx.client.skuCompetitorMappings.create(ctx.shopContext, {
        sku_id: deleteSku.id,
        competitor_product_id: delCompetitorProduct.id,
      });

      await ctx.client.skuCompetitorMappings.delete(ctx.shopContext, record.id);

      // Verify deletion
      try {
        await ctx.client.skuCompetitorMappings.getById(ctx.shopContext, record.id);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as { status: number }).status).toBe(404);
      }
    });
  });

  describe('Import/Export', () => {
    it('should import SKU competitor mappings from JSON (auto-creates competitor products)', async () => {
      const importSku = await ctx.client.skus.create(ctx.shopContext, {
        code: generateTestCode('SKU-IMP'),
        title: 'Import Test SKU',
      });
      const importMarketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
        code: generateTestCode('MP-IMP'),
        title: 'Import Test MP',
      });

      const result = await ctx.client.skuCompetitorMappings.importJson(ctx.shopContext, [
        {
          sku: importSku.code,
          marketplace: importMarketplace.code,
          marketplaceProductId: '444555666',
        },
      ]);

      expect(result.created).toBe(1);
    });

    it('should export SKU competitor mappings to JSON', async () => {
      const items = await ctx.client.skuCompetitorMappings.exportJson(ctx.shopContext);

      expect(Array.isArray(items)).toBe(true);
      if (items.length > 0) {
        expect(items[0]).toHaveProperty('sku');
        expect(items[0]).toHaveProperty('marketplace');
        expect(items[0]).toHaveProperty('marketplace_product_id');
      }
    });

    it('should import SKU competitor mappings from CSV', async () => {
      const csvSku = await ctx.client.skus.create(ctx.shopContext, {
        code: generateTestCode('SKU-CSV'),
        title: 'CSV Test SKU',
      });
      const csvMarketplace = await ctx.client.marketplaces.create(ctx.shopContext, {
        code: generateTestCode('MP-CSV'),
        title: 'CSV Test MP',
      });

      const csv = `marketplace;sku;marketplaceProductId
${csvMarketplace.code};${csvSku.code};777888999`;

      const result = await ctx.client.skuCompetitorMappings.importCsv(ctx.shopContext, csv);

      expect(result.created).toBe(1);
    });

    it('should export SKU competitor mappings to CSV', async () => {
      const csv = await ctx.client.skuCompetitorMappings.exportCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('sku');
      expect(csv).toContain('marketplace');
      expect(csv).toContain('marketplace_product_id');
    });

    it('should auto-create missing SKUs and marketplaces on import', async () => {
      // Get initial counts
      const skusBefore = await ctx.client.skus.getAll(ctx.shopContext);
      const marketplacesBefore = await ctx.client.marketplaces.getAll(ctx.shopContext);

      const skuCode = `newsku${generateUniqueId()}`;
      const mpCode = `newmp${generateUniqueId()}`;
      const result = await ctx.client.skuCompetitorMappings.importJson(ctx.shopContext, [
        {
          sku: skuCode,
          marketplace: mpCode,
          marketplaceProductId: '123456789',
        },
      ]);

      expect(result.created).toBe(1);

      // Verify auto-created SKU exists with correct data
      const skusAfter = await ctx.client.skus.getAll(ctx.shopContext);
      expect(skusAfter.total).toBe(skusBefore.total + 1);
      const newSku = skusAfter.items.find((s) => !skusBefore.items.some((b) => b.id === s.id));
      expect(newSku).toBeDefined();
      // Code is normalized, title defaults to normalized code
      expect(newSku?.code).toContain('newsku');
      expect(newSku?.title).toBe(newSku?.code);

      // Verify auto-created marketplace exists with correct data
      const marketplacesAfter = await ctx.client.marketplaces.getAll(ctx.shopContext);
      expect(marketplacesAfter.total).toBe(marketplacesBefore.total + 1);
      const newMarketplace = marketplacesAfter.items.find(
        (m) => !marketplacesBefore.items.some((b) => b.id === m.id),
      );
      expect(newMarketplace).toBeDefined();
      expect(newMarketplace?.code).toContain('newmp');
      expect(newMarketplace?.title).toBe(newMarketplace?.code);
    });
  });
});
