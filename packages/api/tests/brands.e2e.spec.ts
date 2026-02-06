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

describe('Brands (e2e)', () => {
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
      userEmail: `brand-test-${generateUniqueId()}@example.com`,
      userName: 'Brand Test User',
    });
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.brands.getAll(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.brands.getAll(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create brand', async () => {
      const newBrand = { code: generateTestCode('brand'), title: 'Test Brand' };
      const brand = await ctx.client.brands.create(ctx.shopContext, newBrand);

      expect(brand).toHaveProperty('id');
      expect(brand.code).toBe(normalizeCode(newBrand.code));
      expect(brand.title).toBe(newBrand.title);
      expect(brand.shop_id).toBe(ctx.shop.id);
      expect(brand.tenant_id).toBe(ctx.tenant.id);
    });

    it('should list brands', async () => {
      await ctx.client.brands.create(ctx.shopContext, {
        code: generateTestCode('brand-list'),
        title: 'List Brand',
      });

      const brands = await ctx.client.brands.getAll(ctx.shopContext);

      expect(Array.isArray(brands)).toBe(true);
      expect(brands.length).toBeGreaterThan(0);
    });

    it('should get brand by id', async () => {
      const created = await ctx.client.brands.create(ctx.shopContext, {
        code: generateTestCode('brand-get'),
        title: 'Get Brand',
      });

      const brand = await ctx.client.brands.getById(ctx.shopContext, created.id);

      expect(brand.id).toBe(created.id);
    });

    it('should get brand by code', async () => {
      const created = await ctx.client.brands.create(ctx.shopContext, {
        code: generateTestCode('brand-get-code'),
        title: 'Get Brand Code',
      });

      const brand = await ctx.client.brands.getByCode(ctx.shopContext, created.code);

      expect(brand.id).toBe(created.id);
      expect(brand.code).toBe(created.code);
    });

    it('should update brand', async () => {
      const created = await ctx.client.brands.create(ctx.shopContext, {
        code: generateTestCode('brand-update'),
        title: 'To Update',
      });

      const brand = await ctx.client.brands.update(ctx.shopContext, created.id, {
        title: 'Updated Brand Title',
      });

      expect(brand.title).toBe('Updated Brand Title');
    });

    it('should return 409 on duplicate code', async () => {
      const duplicateCode = generateTestCode('brand');
      await ctx.client.brands.create(ctx.shopContext, {
        code: duplicateCode,
        title: 'First Brand',
      });

      await expectConflict(() =>
        ctx.client.brands.create(ctx.shopContext, {
          code: duplicateCode,
          title: 'Duplicate Brand',
        }),
      );
    });
  });

  describe('Delete operations', () => {
    it('should delete brand', async () => {
      const toDelete = await ctx.client.brands.create(ctx.shopContext, {
        code: generateTestCode('brand-delete'),
        title: 'Delete Brand',
      });

      await ctx.client.brands.delete(ctx.shopContext, toDelete.id);
      await expectNotFound(() => ctx.client.brands.getById(ctx.shopContext, toDelete.id));
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
        ctx.client.brands.getAll({
          shop_id: otherCtx.shop.id,
          tenant_id: otherCtx.tenant.id,
        }),
      );
    });

    it('should return 403 when creating for other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.brands.create(
          { shop_id: ctx.shop.id, tenant_id: otherCtx.tenant.id },
          { code: 'forbidden-brand', title: 'Should Fail' },
        ),
      );
    });

    it('should return 404 when getting resource from other tenant', async () => {
      // Create a brand in other tenant
      const otherBrand = await otherCtx.client.brands.create(otherCtx.shopContext, {
        code: generateTestCode('other'),
        title: 'Other Brand',
      });

      // Try to access it from main context
      await expectNotFound(() => ctx.client.brands.getById(ctx.shopContext, otherBrand.id));
      await expectForbidden(() =>
        ctx.client.brands.getByCode(
          {
            shop_id: ctx.shop.id,
            tenant_id: otherCtx.tenant.id,
          },
          otherBrand.code,
        ),
      );
    });

    it('should allow same code in different tenants', async () => {
      const sharedCode = generateTestCode('shared');

      const brand1 = await ctx.client.brands.create(ctx.shopContext, {
        code: sharedCode,
        title: 'Brand in Tenant 1',
      });
      const brand2 = await otherCtx.client.brands.create(otherCtx.shopContext, {
        code: sharedCode,
        title: 'Brand in Tenant 2',
      });

      expect(brand1.code).toBe(normalizeCode(sharedCode));
      expect(brand2.code).toBe(normalizeCode(sharedCode));
      expect(brand1.tenant_id).not.toBe(brand2.tenant_id);
    });
  });

  describe('Import/Export', () => {
    it('should import brands from JSON', async () => {
      const code1 = generateTestCode('import-json-1');
      const code2 = generateTestCode('import-json-2');
      const items = [
        { code: code1, title: 'Import JSON Brand 1' },
        { code: code2, title: 'Import JSON Brand 2' },
      ];

      const result = await ctx.client.brands.importJson(ctx.shopContext, items);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      const brands = await ctx.client.brands.getAll(ctx.shopContext);
      const codes = brands.map((b) => b.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should upsert existing brands on import', async () => {
      const code = generateTestCode('upsert-json');

      await ctx.client.brands.importJson(ctx.shopContext, [{ code, title: 'Original Title' }]);
      const result = await ctx.client.brands.importJson(ctx.shopContext, [
        { code, title: 'Updated Title' },
      ]);

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should import brands from CSV with commas', async () => {
      const code1 = generateTestCode('import-csv-1');
      const code2 = generateTestCode('import-csv-2');
      const csvContent = `code,title\n${code1},Import CSV Brand 1\n${code2},Import CSV Brand 2`;

      const result = await ctx.client.brands.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const brands = await ctx.client.brands.getAll(ctx.shopContext);
      const codes = brands.map((b) => b.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should import brands from CSV with semicolons', async () => {
      const code1 = generateTestCode('import-semi-1');
      const code2 = generateTestCode('import-semi-2');
      const csvContent = `code;title\n${code1};Import Semicolon Brand 1\n${code2};Import Semicolon Brand 2`;

      const result = await ctx.client.brands.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const brands = await ctx.client.brands.getAll(ctx.shopContext);
      const codes = brands.map((b) => b.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should handle Cyrillic characters in CSV', async () => {
      const csvContent = `code;title\nmavyko;Мавико\nmarshall;MARSHALL\nmazda;Mazda`;

      const result = await ctx.client.brands.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(3);
      expect(result.updated).toBe(0);

      const brands = await ctx.client.brands.getAll(ctx.shopContext);
      const mavyko = brands.find((b) => b.code === 'mavyko');
      expect(mavyko).toBeDefined();
      expect(mavyko?.title).toBe('Мавико');
    });

    it('should export brands to JSON', async () => {
      const code1 = generateTestCode('export-brand-1');
      const code2 = generateTestCode('export-brand-2');

      await ctx.client.brands.importJson(ctx.shopContext, [
        { code: code1, title: 'Export Test Brand 1' },
        { code: code2, title: 'Export Test Brand 2' },
      ]);

      const exported = await ctx.client.brands.exportJson(ctx.shopContext);

      expect(Array.isArray(exported)).toBe(true);
      const exportedCodes = exported.map((b) => b.code);
      expect(exportedCodes).toContain(normalizeCode(code1));
      expect(exportedCodes).toContain(normalizeCode(code2));

      const item = exported.find((b) => b.code === normalizeCode(code1));
      expect(item).toEqual({ code: normalizeCode(code1), title: 'Export Test Brand 1' });
    });

    it('should export brands to CSV', async () => {
      const code1 = generateTestCode('csv-export-brand-1');
      const code2 = generateTestCode('csv-export-brand-2');

      await ctx.client.brands.importJson(ctx.shopContext, [
        { code: code1, title: 'CSV Export Test 1' },
        { code: code2, title: 'CSV Export Test 2' },
      ]);

      const csv = await ctx.client.brands.exportCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('code,title');
      expect(lines.some((line) => line.includes(normalizeCode(code1)))).toBe(true);
      expect(lines.some((line) => line.includes(normalizeCode(code2)))).toBe(true);
    });
  });

  describe('Example downloads', () => {
    it('should return JSON example', async () => {
      const examples = await ctx.client.brands.getExampleJson();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('code');
      expect(examples[0]).toHaveProperty('title');
    });

    it('should return CSV example', async () => {
      const csv = await ctx.client.brands.getExampleCsv();

      expect(typeof csv).toBe('string');
      expect(csv).toContain('code,title');
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
        const editorRole = roles.find((r) => r.name === ROLE_NAMES.EDITOR);
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

      it('editor should list brands', async () => {
        const brands = await editorClient.brands.getAll(ctx.shopContext);
        expect(Array.isArray(brands)).toBe(true);
      });

      it('editor should create brand', async () => {
        const brand = await editorClient.brands.create(ctx.shopContext, {
          code: generateTestCode('editor-brand'),
          title: 'Editor Brand',
        });
        expect(brand).toHaveProperty('id');
      });

      it('editor should get brand by code', async () => {
        const brands = await editorClient.brands.getAll(ctx.shopContext);
        if (brands.length === 0) throw new Error('Expected at least one brand for editor');
        const firstBrand = brands[0];
        if (!firstBrand) throw new Error('Expected brand');
        const brand = await editorClient.brands.getByCode(ctx.shopContext, firstBrand.code);
        expect(brand.id).toBe(firstBrand.id);
      });

      it('editor should update brand', async () => {
        const brands = await editorClient.brands.getAll(ctx.shopContext);
        if (brands.length > 0) {
          const firstBrand = brands[0];
          if (!firstBrand) throw new Error('Expected brand');
          const updated = await editorClient.brands.update(ctx.shopContext, firstBrand.id, {
            title: 'Editor Updated',
          });
          expect(updated.title).toBe('Editor Updated');
        }
      });

      it('editor should delete brand', async () => {
        const brand = await editorClient.brands.create(ctx.shopContext, {
          code: generateTestCode('editor-delete'),
          title: 'To Delete',
        });
        await editorClient.brands.delete(ctx.shopContext, brand.id);
        await expectNotFound(() => editorClient.brands.getById(ctx.shopContext, brand.id));
      });

      it('editor should import brands', async () => {
        const result = await editorClient.brands.importJson(ctx.shopContext, [
          { code: generateTestCode('editor-import'), title: 'Editor Import' },
        ]);
        expect(result.created).toBe(1);
      });

      it('editor should export brands', async () => {
        const exported = await editorClient.brands.exportJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });
    });

    describe('Viewer role', () => {
      let viewerUserId: number;
      let viewerClient: SalesPlannerClient;

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
        const viewerRole = roles.find((r) => r.name === ROLE_NAMES.VIEWER);
        if (!viewerRole) throw new Error('Viewer role not found');
        await ctx.getSystemClient().userRoles.create({
          user_id: viewerUserId,
          role_id: viewerRole.id,
          tenant_id: ctx.tenant.id,
          shop_id: ctx.shop.id,
        });
      });

      afterAll(async () => {
        if (viewerUserId) await cleanupUser(app, viewerUserId);
      });

      it('viewer should list brands', async () => {
        const brands = await viewerClient.brands.getAll(ctx.shopContext);
        expect(Array.isArray(brands)).toBe(true);
      });

      it('viewer should get brand by id', async () => {
        const brands = await viewerClient.brands.getAll(ctx.shopContext);
        if (brands.length > 0) {
          const firstBrand = brands[0];
          if (!firstBrand) throw new Error('Expected brand');
          const brand = await viewerClient.brands.getById(ctx.shopContext, firstBrand.id);
          expect(brand.id).toBe(firstBrand.id);
        }
      });

      it('viewer should get brand by code', async () => {
        const brands = await viewerClient.brands.getAll(ctx.shopContext);
        if (brands.length === 0) throw new Error('Expected at least one brand for viewer');
        const firstBrand = brands[0];
        if (!firstBrand) throw new Error('Expected brand');
        const brand = await viewerClient.brands.getByCode(ctx.shopContext, firstBrand.code);
        expect(brand.id).toBe(firstBrand.id);
      });

      it('viewer should NOT create brand', async () => {
        await expectForbidden(() =>
          viewerClient.brands.create(ctx.shopContext, {
            code: 'viewer-brand',
            title: 'Should Fail',
          }),
        );
      });

      it('viewer should NOT update brand', async () => {
        const brands = await viewerClient.brands.getAll(ctx.shopContext);
        if (brands.length > 0) {
          const firstBrand = brands[0];
          if (!firstBrand) throw new Error('Expected brand');
          await expectForbidden(() =>
            viewerClient.brands.update(ctx.shopContext, firstBrand.id, {
              title: 'Should Fail',
            }),
          );
        }
      });

      it('viewer should NOT delete brand', async () => {
        const brands = await viewerClient.brands.getAll(ctx.shopContext);
        if (brands.length > 0) {
          const firstBrand = brands[0];
          if (!firstBrand) throw new Error('Expected brand');
          await expectForbidden(() =>
            viewerClient.brands.delete(ctx.shopContext, firstBrand.id),
          );
        }
      });

      it('viewer should export brands', async () => {
        const exported = await viewerClient.brands.exportJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('viewer should NOT import brands', async () => {
        await expectForbidden(() =>
          viewerClient.brands.importJson(ctx.shopContext, [{ code: 'test', title: 'Should Fail' }]),
        );
      });
    });
  });
});
