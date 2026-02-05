import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ROLE_NAMES } from '../src/common/constants.js';
import { normalizeCode } from '../src/lib/normalize-code.js';
import { TestContext } from './test-context.js';
import {
  cleanupUser,
  expectConflict,
  expectForbidden,
  expectNotFound,
  expectUnauthorized,
  generateTestCode,
  generateUniqueId,
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
      tenantTitle: `Test Tenant ${generateUniqueId()}`,
      userEmail: `mp-test-${generateUniqueId()}@example.com`,
      userName: 'Marketplace Test User',
    });
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.getMarketplaces(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.getMarketplaces(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create marketplace', async () => {
      const newMarketplace = { code: generateTestCode('marketplace'), title: 'Test Marketplace' };
      const marketplace = await ctx.client.createMarketplace(newMarketplace, ctx.shopContext);

      expect(marketplace).toHaveProperty('id');
      expect(marketplace.code).toBe(normalizeCode(newMarketplace.code));
      expect(marketplace.title).toBe(newMarketplace.title);
      expect(marketplace.shop_id).toBe(ctx.shop.id);
      expect(marketplace.tenant_id).toBe(ctx.tenant.id);
    });

    it('should list marketplaces', async () => {
      await ctx.client.createMarketplace(
        { code: generateTestCode('marketplace-list'), title: 'List Marketplace' },
        ctx.shopContext,
      );

      const marketplaces = await ctx.client.getMarketplaces(ctx.shopContext);

      expect(Array.isArray(marketplaces)).toBe(true);
      expect(marketplaces.length).toBeGreaterThan(0);
      marketplaces.forEach((mp) => {
        expect(mp.shop_id).toBe(ctx.shop.id);
        expect(mp.tenant_id).toBe(ctx.tenant.id);
      });
    });

    it('should get marketplace by id', async () => {
      const created = await ctx.client.createMarketplace(
        { code: generateTestCode('marketplace-get'), title: 'Get Marketplace' },
        ctx.shopContext,
      );

      const marketplace = await ctx.client.getMarketplace(created.id, ctx.shopContext);

      expect(marketplace.id).toBe(created.id);
    });

    it('should get marketplace by code', async () => {
      const created = await ctx.client.createMarketplace(
        { code: generateTestCode('marketplace-get-code'), title: 'Get Marketplace Code' },
        ctx.shopContext,
      );

      const marketplace = await ctx.client.getMarketplaceByCode(created.code, ctx.shopContext);

      expect(marketplace.id).toBe(created.id);
      expect(marketplace.code).toBe(created.code);
    });

    it('should update marketplace', async () => {
      const created = await ctx.client.createMarketplace(
        { code: generateTestCode('marketplace-update'), title: 'To Update' },
        ctx.shopContext,
      );

      const marketplace = await ctx.client.updateMarketplace(
        created.id,
        { title: 'Updated Marketplace Title' },
        ctx.shopContext,
      );

      expect(marketplace.title).toBe('Updated Marketplace Title');
    });

    it('should return 409 on duplicate code', async () => {
      const duplicateCode = generateTestCode('marketplace');
      await ctx.client.createMarketplace(
        { code: duplicateCode, title: 'First Marketplace' },
        ctx.shopContext,
      );

      await expectConflict(() =>
        ctx.client.createMarketplace(
          { code: duplicateCode, title: 'Duplicate Marketplace' },
          ctx.shopContext,
        ),
      );
    });

    it('should return 404 for non-existent marketplace', async () => {
      await expectNotFound(() => ctx.client.getMarketplace(999999, ctx.shopContext));
    });
  });

  describe('Delete operations', () => {
    it('should delete marketplace', async () => {
      const toDelete = await ctx.client.createMarketplace(
        { code: generateTestCode('marketplace-delete'), title: 'Delete Marketplace' },
        ctx.shopContext,
      );

      await ctx.client.deleteMarketplace(toDelete.id, ctx.shopContext);
      await expectNotFound(() => ctx.client.getMarketplace(toDelete.id, ctx.shopContext));
    });
  });

  describe('Tenant-based access control', () => {
    let otherCtx: TestContext;

    beforeAll(async () => {
      otherCtx = await TestContext.create(app, baseUrl, {
        tenantTitle: `Other Tenant ${generateUniqueId()}`,
        userEmail: `other-tenant-${generateUniqueId()}@example.com`,
        userName: 'Other Tenant User',
      });
    });

    afterAll(async () => {
      if (otherCtx) await otherCtx.dispose();
    });

    it('should return 403 when accessing other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.getMarketplaces({
          shop_id: otherCtx.shop.id,
          tenant_id: otherCtx.tenant.id,
        }),
      );
    });

    it('should return 403 when creating for other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.createMarketplace(
          { code: 'forbidden-marketplace', title: 'Should Fail' },
          { shop_id: ctx.shop.id, tenant_id: otherCtx.tenant.id },
        ),
      );
    });

    it('should return 404 when getting resource from other tenant', async () => {
      const otherMarketplace = await otherCtx.client.createMarketplace(
        { code: generateTestCode('other'), title: 'Other Marketplace' },
        otherCtx.shopContext,
      );

      await expectNotFound(() => ctx.client.getMarketplace(otherMarketplace.id, ctx.shopContext));
    });

    it('should allow same code in different tenants', async () => {
      const sharedCode = generateTestCode('shared');

      const marketplace1 = await ctx.client.createMarketplace(
        { code: sharedCode, title: 'Marketplace in Tenant 1' },
        ctx.shopContext,
      );
      const marketplace2 = await otherCtx.client.createMarketplace(
        { code: sharedCode, title: 'Marketplace in Tenant 2' },
        otherCtx.shopContext,
      );

      expect(marketplace1.code).toBe(normalizeCode(sharedCode));
      expect(marketplace2.code).toBe(normalizeCode(sharedCode));
      expect(marketplace1.tenant_id).not.toBe(marketplace2.tenant_id);
    });
  });

  describe('Import/Export', () => {
    it('should import marketplaces from JSON', async () => {
      const code1 = generateTestCode('import-json-1');
      const code2 = generateTestCode('import-json-2');
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

    it('should upsert existing marketplaces on import', async () => {
      const code = generateTestCode('upsert-json');

      await ctx.client.importMarketplacesJson([{ code, title: 'Original Title' }], ctx.shopContext);
      const result = await ctx.client.importMarketplacesJson(
        [{ code, title: 'Updated Title' }],
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should import marketplaces from CSV', async () => {
      const code1 = generateTestCode('import-csv-1');
      const code2 = generateTestCode('import-csv-2');
      const csvContent = `code,title\n${code1},Import CSV Marketplace 1\n${code2},Import CSV Marketplace 2`;

      const result = await ctx.client.importMarketplacesCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const marketplaces = await ctx.client.getMarketplaces(ctx.shopContext);
      const codes = marketplaces.map((m) => m.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should export marketplaces to JSON', async () => {
      const code1 = generateTestCode('export-mp-1');
      const code2 = generateTestCode('export-mp-2');

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

    it('should export marketplaces to CSV', async () => {
      const code1 = generateTestCode('csv-export-mp-1');
      const code2 = generateTestCode('csv-export-mp-2');

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
  });

  describe('Example downloads', () => {
    it('should return JSON example', async () => {
      const examples = await ctx.client.getMarketplaceExamplesJson();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('code');
      expect(examples[0]).toHaveProperty('title');
    });

    it('should return CSV example', async () => {
      const csv = await ctx.client.getMarketplaceExamplesCsv();

      expect(typeof csv).toBe('string');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('code,title');
      expect(lines.length).toBeGreaterThan(1);
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
        {
          await ctx.getSystemClient().createUserRole({
            user_id: editorUserId,
            role_id: editorRole.id,
            tenant_id: ctx.tenant.id,
            shop_id: ctx.shop.id,
          });
        }
      });

      afterAll(async () => {
        if (editorUserId) await cleanupUser(app, editorUserId);
      });

      it('editor should list marketplaces', async () => {
        const marketplaces = await editorClient.getMarketplaces(ctx.shopContext);
        expect(Array.isArray(marketplaces)).toBe(true);
      });

      it('editor should create marketplace', async () => {
        const marketplace = await editorClient.createMarketplace(
          { code: generateTestCode('editor-mp'), title: 'Editor Marketplace' },
          ctx.shopContext,
        );
        expect(marketplace).toHaveProperty('id');
      });

      it('editor should update marketplace', async () => {
        const marketplaces = await editorClient.getMarketplaces(ctx.shopContext);
        if (marketplaces.length > 0) {
          const firstMarketplace = marketplaces[0];
          if (!firstMarketplace) throw new Error('Expected marketplace');
          const updated = await editorClient.updateMarketplace(
            firstMarketplace.id,
            { title: 'Editor Updated' },
            ctx.shopContext,
          );
          expect(updated.title).toBe('Editor Updated');
        }
      });

      it('editor should delete marketplace', async () => {
        const marketplace = await editorClient.createMarketplace(
          { code: generateTestCode('editor-delete'), title: 'To Delete' },
          ctx.shopContext,
        );
        await editorClient.deleteMarketplace(marketplace.id, ctx.shopContext);
        await expectNotFound(() => editorClient.getMarketplace(marketplace.id, ctx.shopContext));
      });

      it('editor should import marketplaces', async () => {
        const result = await editorClient.importMarketplacesJson(
          [{ code: generateTestCode('editor-import'), title: 'Editor Import' }],
          ctx.shopContext,
        );
        expect(result.created).toBe(1);
      });

      it('editor should export marketplaces', async () => {
        const exported = await editorClient.exportMarketplacesJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });
    });

    describe('Viewer role', () => {
      let viewerUserId: number;
      let viewerClient: SalesPlannerClient;

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
        {
          await ctx.getSystemClient().createUserRole({
            user_id: viewerUserId,
            role_id: viewerRole.id,
            tenant_id: ctx.tenant.id,
            shop_id: ctx.shop.id,
          });
        }
      });

      afterAll(async () => {
        if (viewerUserId) await cleanupUser(app, viewerUserId);
      });

      it('viewer should list marketplaces', async () => {
        const marketplaces = await viewerClient.getMarketplaces(ctx.shopContext);
        expect(Array.isArray(marketplaces)).toBe(true);
      });

      it('viewer should get marketplace by id', async () => {
        const marketplaces = await viewerClient.getMarketplaces(ctx.shopContext);
        if (marketplaces.length > 0) {
          const firstMarketplace = marketplaces[0];
          if (!firstMarketplace) throw new Error('Expected marketplace');
          const marketplace = await viewerClient.getMarketplace(
            firstMarketplace.id,
            ctx.shopContext,
          );
          expect(marketplace.id).toBe(firstMarketplace.id);
        }
      });

      it('viewer should NOT create marketplace', async () => {
        await expectForbidden(() =>
          viewerClient.createMarketplace(
            { code: 'viewer-mp', title: 'Should Fail' },
            ctx.shopContext,
          ),
        );
      });

      it('viewer should NOT update marketplace', async () => {
        const marketplaces = await viewerClient.getMarketplaces(ctx.shopContext);
        if (marketplaces.length > 0) {
          const firstMarketplace = marketplaces[0];
          if (!firstMarketplace) throw new Error('Expected marketplace');
          await expectForbidden(() =>
            viewerClient.updateMarketplace(
              firstMarketplace.id,
              { title: 'Should Fail' },
              ctx.shopContext,
            ),
          );
        }
      });

      it('viewer should NOT delete marketplace', async () => {
        const marketplaces = await viewerClient.getMarketplaces(ctx.shopContext);
        if (marketplaces.length > 0) {
          const firstMarketplace = marketplaces[0];
          if (!firstMarketplace) throw new Error('Expected marketplace');
          await expectForbidden(() =>
            viewerClient.deleteMarketplace(firstMarketplace.id, ctx.shopContext),
          );
        }
      });

      it('viewer should export marketplaces', async () => {
        const exported = await viewerClient.exportMarketplacesJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('viewer should NOT import marketplaces', async () => {
        await expectForbidden(() =>
          viewerClient.importMarketplacesJson(
            [{ code: 'test', title: 'Should Fail' }],
            ctx.shopContext,
          ),
        );
      });
    });
  });
});
