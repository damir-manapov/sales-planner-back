import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { normalizeCode } from '../src/lib/normalize-code.js';
import { TestContext } from './test-context.js';
import {
  generateUniqueId,
  generateTestCode,
  expectNotFound,
  expectConflict,
  expectForbidden,
  cleanupUser,
} from './test-helpers.js';

describe('Marketplaces (e2e)', () => {
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
      userEmail: `mp-test-${generateUniqueId()}@example.com`,
      userName: 'Marketplace Test User',
    });
  });

  afterAll(async () => {
    if (ctx) {
      await ctx.dispose();
    }
    await app.close();
  });

  describe('GET /marketplaces', () => {
    it('should list marketplaces for the shop', async () => {
      const marketplaces = await ctx.client.getMarketplaces(ctx.shopContext);
      expect(Array.isArray(marketplaces)).toBe(true);
      // Should only return marketplaces for this shop
      marketplaces.forEach((mp) => {
        expect(mp.shop_id).toBe(ctx.shop.id);
        expect(mp.tenant_id).toBe(ctx.tenant.id);
      });
    });
  });

  describe('POST /marketplaces', () => {
    const testMarketplaceCode = generateTestCode('MP-CREATE');

    it("should create marketplace in the user's shop", async () => {
      const marketplace = await ctx.client.createMarketplace(
        { code: testMarketplaceCode, title: 'Test Marketplace' },
        ctx.shopContext,
      );
      expect(marketplace.code).toBe(normalizeCode(testMarketplaceCode));
      expect(marketplace.title).toBe('Test Marketplace');
      expect(marketplace.shop_id).toBe(ctx.shop.id);
      expect(marketplace.tenant_id).toBe(ctx.tenant.id);
    });

    it('should return 409 on duplicate marketplace code in same shop', async () => {
      await expectConflict(() =>
        ctx.client.createMarketplace(
          { code: testMarketplaceCode, title: 'Duplicate' },
          ctx.shopContext,
        ),
      );
    });
  });

  describe('GET /marketplaces/:id', () => {
    const testMarketplaceCode = generateTestCode('MP-GET');
    let marketplaceId: number;

    beforeAll(async () => {
      const marketplace = await ctx.client.createMarketplace(
        { code: testMarketplaceCode, title: 'Test' },
        ctx.shopContext,
      );
      marketplaceId = marketplace.id;
    });

    it('should get marketplace by id', async () => {
      const marketplace = await ctx.client.getMarketplace(marketplaceId, ctx.shopContext);
      expect(marketplace.code).toBe(normalizeCode(testMarketplaceCode));
      expect(marketplace.shop_id).toBe(ctx.shop.id);
    });

    it('should return 404 for non-existent marketplace', async () => {
      await expectNotFound(() => ctx.client.getMarketplace(999999, ctx.shopContext));
    });
  });

  describe('PUT /marketplaces/:id', () => {
    const testMarketplaceCode = generateTestCode('MP-UPDATE');
    let marketplaceId: number;

    beforeAll(async () => {
      const marketplace = await ctx.client.createMarketplace(
        { code: testMarketplaceCode, title: 'Original' },
        ctx.shopContext,
      );
      marketplaceId = marketplace.id;
    });

    it('should update marketplace', async () => {
      const marketplace = await ctx.client.updateMarketplace(
        marketplaceId,
        { title: 'Updated Title' },
        ctx.shopContext,
      );
      expect(marketplace.title).toBe('Updated Title');
      expect(marketplace.shop_id).toBe(ctx.shop.id);
    });

    it('should return 404 for non-existent marketplace', async () => {
      await expectNotFound(() =>
        ctx.client.updateMarketplace(999999, { title: 'Updated' }, ctx.shopContext),
      );
    });
  });

  describe('DELETE /marketplaces/:id', () => {
    const testMarketplaceCode = generateTestCode('MP-DELETE');
    let marketplaceId: number;

    beforeAll(async () => {
      const marketplace = await ctx.client.createMarketplace(
        { code: testMarketplaceCode, title: 'To Delete' },
        ctx.shopContext,
      );
      marketplaceId = marketplace.id;
    });

    it('should delete marketplace', async () => {
      await ctx.client.deleteMarketplace(marketplaceId, ctx.shopContext);

      // Verify it's deleted
      await expectNotFound(() => ctx.client.getMarketplace(marketplaceId, ctx.shopContext));
    });
  });

  describe('Shop isolation', () => {
    let otherCtx: TestContext;
    const isolatedMarketplaceCode = generateTestCode('MP-ISOLATED');

    beforeAll(async () => {
      // Create another tenant/shop/user
      otherCtx = await TestContext.create(app, baseUrl, {
        tenantTitle: `Other Tenant ${generateUniqueId()}`,
        userEmail: `mp-other-${generateUniqueId()}@example.com`,
        userName: 'Other User',
      });

      // Create marketplace in first shop
      await ctx.client.createMarketplace(
        { code: isolatedMarketplaceCode, title: 'Isolated' },
        ctx.shopContext,
      );
    });

    afterAll(async () => {
      if (otherCtx) {
        await otherCtx.dispose();
      }
    });

    it('should not see marketplaces from other shops', async () => {
      const marketplaces = await otherCtx.client.getMarketplaces(otherCtx.shopContext);
      const found = marketplaces.find((m) => m.code === isolatedMarketplaceCode);
      expect(found).toBeUndefined();
    });

    it('should not access marketplace from other shop', async () => {
      // Get the marketplace ID from the first shop
      const marketplaces = await ctx.client.getMarketplaces(ctx.shopContext);
      const marketplace = marketplaces.find(
        (m) => m.code === normalizeCode(isolatedMarketplaceCode),
      );
      expect(marketplace).toBeDefined();
      if (!marketplace) throw new Error('Marketplace not found');

      await expectNotFound(() =>
        otherCtx.client.getMarketplace(marketplace.id, otherCtx.shopContext),
      );
    });

    it('should allow same marketplace code in different shops', async () => {
      const marketplace = await otherCtx.client.createMarketplace(
        { code: isolatedMarketplaceCode, title: 'Same Code Different Shop' },
        otherCtx.shopContext,
      );
      expect(marketplace.code).toBe(normalizeCode(isolatedMarketplaceCode));
      expect(marketplace.shop_id).toBe(otherCtx.shop.id);
    });
  });

  describe('Import/Export endpoints', () => {
    it('importMarketplacesJson - should import marketplaces from JSON', async () => {
      const code1 = generateTestCode('IMPORT-JSON-1');
      const code2 = generateTestCode('IMPORT-JSON-2');
      const items = [
        { code: code1, title: 'Import JSON Marketplace 1' },
        { code: code2, title: 'Import JSON Marketplace 2' },
      ];

      const result = await ctx.client.importMarketplacesJson(items, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      const marketplaces = await ctx.client.getMarketplaces(ctx.shopContext);
      const codes = marketplaces.map((m) => m.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('importMarketplacesJson - should upsert existing marketplaces', async () => {
      const code = generateTestCode('UPSERT-JSON');

      const created = await ctx.client.importMarketplacesJson(
        [{ code, title: 'Original Title' }],
        ctx.shopContext,
      );
      expect(created.created).toBe(1);

      const result = await ctx.client.importMarketplacesJson(
        [{ code, title: 'Updated Title' }],
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);

      // Find by code in the list
      const marketplaces = await ctx.client.getMarketplaces(ctx.shopContext);
      const marketplace = marketplaces.find((m) => m.code === normalizeCode(code));
      expect(marketplace).toBeDefined();
      if (!marketplace) throw new Error('Marketplace not found');
      expect(marketplace.title).toBe('Updated Title');
    });

    it('importMarketplacesCsv - should import marketplaces from CSV', async () => {
      const code1 = generateTestCode('IMPORT-CSV-1');
      const code2 = generateTestCode('IMPORT-CSV-2');
      const csvContent = `code,title\n${code1},Import CSV Marketplace 1\n${code2},Import CSV Marketplace 2`;

      const result = await ctx.client.importMarketplacesCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const marketplaces = await ctx.client.getMarketplaces(ctx.shopContext);
      const codes = marketplaces.map((m) => m.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('exportMarketplacesJson - should export marketplaces in import format', async () => {
      const code1 = generateTestCode('EXPORT-MP-1');
      const code2 = generateTestCode('EXPORT-MP-2');

      await ctx.client.importMarketplacesJson(
        [
          { code: code1, title: 'Export Test Marketplace 1' },
          { code: code2, title: 'Export Test Marketplace 2' },
        ],
        ctx.shopContext,
      );

      const exported = await ctx.client.exportMarketplacesJson(ctx.shopContext);

      expect(Array.isArray(exported)).toBe(true);
      const exportedCodes = exported.map((m) => m.code);
      expect(exportedCodes).toContain(normalizeCode(code1));
      expect(exportedCodes).toContain(normalizeCode(code2));

      const item = exported.find((m) => m.code === normalizeCode(code1));
      expect(item).toEqual({ code: normalizeCode(code1), title: 'Export Test Marketplace 1' });
    });

    it('exportMarketplacesCsv - should export marketplaces in CSV format', async () => {
      const code1 = generateTestCode('CSV-EXPORT-MP-1');
      const code2 = generateTestCode('CSV-EXPORT-MP-2');

      await ctx.client.importMarketplacesJson(
        [
          { code: code1, title: 'CSV Export Test 1' },
          { code: code2, title: 'CSV Export Test 2' },
        ],
        ctx.shopContext,
      );

      const csv = await ctx.client.exportMarketplacesCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('code,title');
      expect(lines.some((line) => line.includes(normalizeCode(code1)))).toBe(true);
      expect(lines.some((line) => line.includes(normalizeCode(code2)))).toBe(true);
    });

    it('getMarketplaceExamplesJson - should return example marketplaces', async () => {
      const examples = await ctx.client.getMarketplaceExamplesJson();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('code');
      expect(examples[0]).toHaveProperty('title');
    });

    it('getMarketplaceExamplesCsv - should return example CSV', async () => {
      const csv = await ctx.client.getMarketplaceExamplesCsv();

      expect(typeof csv).toBe('string');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('code,title');
      expect(lines.length).toBeGreaterThan(1);
    });
  });

  describe('Viewer role access', () => {
    let viewerUserId: number;
    let viewerClient: SalesPlannerClient;

    beforeAll(async () => {
      // Create viewer user
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

      // Assign viewer role
      const roles = await ctx.getSystemClient().getRoles();
      const viewerRole = roles.find((r) => r.name === 'viewer');
      if (viewerRole) {
        await ctx.getSystemClient().createUserRole({
          user_id: viewerUserId,
          role_id: viewerRole.id,
          tenant_id: ctx.tenant.id,
          shop_id: ctx.shop.id,
        });
      }
    });

    afterAll(async () => {
      if (viewerUserId) {
        await cleanupUser(app, viewerUserId);
      }
    });

    it('viewer should be able to list marketplaces', async () => {
      const marketplaces = await viewerClient.getMarketplaces(ctx.shopContext);
      expect(Array.isArray(marketplaces)).toBe(true);
    });

    it('viewer should be able to get single marketplace', async () => {
      const marketplaces = await viewerClient.getMarketplaces(ctx.shopContext);
      if (marketplaces.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length check ensures element exists
        const firstMarketplace = marketplaces[0]!;
        const marketplace = await viewerClient.getMarketplace(firstMarketplace.id, ctx.shopContext);
        expect(marketplace.id).toBe(firstMarketplace.id);
      }
    });

    it('viewer should NOT be able to create marketplace', async () => {
      await expectForbidden(() =>
        viewerClient.createMarketplace(
          { code: 'viewer-mp', title: 'Should Fail' },
          ctx.shopContext,
        ),
      );
    });

    it('viewer should NOT be able to update marketplace', async () => {
      const marketplaces = await viewerClient.getMarketplaces(ctx.shopContext);
      if (marketplaces.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length check ensures element exists
        const firstMarketplace = marketplaces[0]!;
        await expectForbidden(() =>
          viewerClient.updateMarketplace(
            firstMarketplace.id,
            { title: 'Should Fail' },
            ctx.shopContext,
          ),
        );
      }
    });

    it('viewer should NOT be able to delete marketplace', async () => {
      const marketplaces = await viewerClient.getMarketplaces(ctx.shopContext);
      if (marketplaces.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length check ensures element exists
        const firstMarketplace = marketplaces[0]!;
        await expectForbidden(() =>
          viewerClient.deleteMarketplace(firstMarketplace.id, ctx.shopContext),
        );
      }
    });

    it('viewer should be able to export marketplaces', async () => {
      const exported = await viewerClient.exportMarketplacesJson(ctx.shopContext);
      expect(Array.isArray(exported)).toBe(true);
    });

    it('viewer should NOT be able to import marketplaces', async () => {
      await expectForbidden(() =>
        viewerClient.importMarketplacesJson(
          [{ code: 'test', title: 'Should Fail' }],
          ctx.shopContext,
        ),
      );
    });
  });
});
