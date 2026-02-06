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

describe('Categories (e2e)', () => {
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
      userEmail: `category-test-${generateUniqueId()}@example.com`,
      userName: 'Category Test User',
    });
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.categories.getAll(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.categories.getAll(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create category', async () => {
      const newCategory = { code: generateTestCode('category'), title: 'Test Category' };
      const category = await ctx.client.categories.create(ctx.shopContext, newCategory);

      expect(category).toHaveProperty('id');
      expect(category.code).toBe(normalizeCode(newCategory.code));
      expect(category.title).toBe(newCategory.title);
      expect(category.shop_id).toBe(ctx.shop.id);
      expect(category.tenant_id).toBe(ctx.tenant.id);
    });

    it('should list categories', async () => {
      await ctx.client.categories.create(ctx.shopContext, {
        code: generateTestCode('category-list'),
        title: 'List Category',
      });

      const categories = await ctx.client.categories.getAll(ctx.shopContext);

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should get category by id', async () => {
      const created = await ctx.client.categories.create(ctx.shopContext, {
        code: generateTestCode('category-get'),
        title: 'Get Category',
      });

      const category = await ctx.client.categories.getById(ctx.shopContext, created.id);

      expect(category.id).toBe(created.id);
    });

    it('should get category by code', async () => {
      const created = await ctx.client.categories.create(ctx.shopContext, {
        code: generateTestCode('category-get-code'),
        title: 'Get Category Code',
      });

      const category = await ctx.client.categories.getByCode(ctx.shopContext, created.code);

      expect(category.id).toBe(created.id);
      expect(category.code).toBe(created.code);
    });

    it('should update category', async () => {
      const created = await ctx.client.categories.create(ctx.shopContext, {
        code: generateTestCode('category-update'),
        title: 'To Update',
      });

      const category = await ctx.client.categories.update(ctx.shopContext, created.id, {
        title: 'Updated Category Title',
      });

      expect(category.title).toBe('Updated Category Title');
    });

    it('should return 409 on duplicate code', async () => {
      const duplicateCode = generateTestCode('category');
      await ctx.client.categories.create(ctx.shopContext, {
        code: duplicateCode,
        title: 'First Category',
      });

      await expectConflict(() =>
        ctx.client.categories.create(ctx.shopContext, {
          code: duplicateCode,
          title: 'Duplicate Category',
        }),
      );
    });
  });

  describe('Delete operations', () => {
    it('should delete category', async () => {
      const toDelete = await ctx.client.categories.create(ctx.shopContext, {
        code: generateTestCode('category-delete'),
        title: 'Delete Category',
      });

      await ctx.client.categories.delete(ctx.shopContext, toDelete.id);
      await expectNotFound(() => ctx.client.categories.getById(ctx.shopContext, toDelete.id));
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
        ctx.client.categories.getAll({
          shop_id: otherCtx.shop.id,
          tenant_id: otherCtx.tenant.id,
        }),
      );
    });

    it('should return 403 when creating for other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.categories.create(
          { shop_id: ctx.shop.id, tenant_id: otherCtx.tenant.id },
          { code: 'forbidden-category', title: 'Should Fail' },
        ),
      );
    });

    it('should return 404 when getting resource from other tenant', async () => {
      const otherCategory = await otherCtx.client.categories.create(otherCtx.shopContext, {
        code: generateTestCode('other'),
        title: 'Other Category',
      });

      await expectNotFound(() =>
        ctx.client.categories.getById(ctx.shopContext, otherCategory.id),
      );
      await expectForbidden(() =>
        ctx.client.categories.getByCode(
          {
            shop_id: ctx.shop.id,
            tenant_id: otherCtx.tenant.id,
          },
          otherCategory.code,
        ),
      );
    });

    it('should allow same code in different tenants', async () => {
      const sharedCode = generateTestCode('shared');

      const category1 = await ctx.client.categories.create(ctx.shopContext, {
        code: sharedCode,
        title: 'Category in Tenant 1',
      });
      const category2 = await otherCtx.client.categories.create(otherCtx.shopContext, {
        code: sharedCode,
        title: 'Category in Tenant 2',
      });

      expect(category1.code).toBe(normalizeCode(sharedCode));
      expect(category2.code).toBe(normalizeCode(sharedCode));
      expect(category1.tenant_id).not.toBe(category2.tenant_id);
    });
  });

  describe('Import/Export', () => {
    it('should import categories from JSON', async () => {
      const code1 = generateTestCode('import-json-1');
      const code2 = generateTestCode('import-json-2');
      const items = [
        { code: code1, title: 'Import JSON Category 1' },
        { code: code2, title: 'Import JSON Category 2' },
      ];

      const result = await ctx.client.categories.importJson(ctx.shopContext, items);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      const categories = await ctx.client.categories.getAll(ctx.shopContext);
      const codes = categories.map((c) => c.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should upsert existing categories on import', async () => {
      const code = generateTestCode('upsert-json');

      await ctx.client.categories.importJson(ctx.shopContext, [{ code, title: 'Original Title' }]);
      const result = await ctx.client.categories.importJson(ctx.shopContext, [
        { code, title: 'Updated Title' },
      ]);

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should import categories from CSV with commas', async () => {
      const code1 = generateTestCode('import-csv-1');
      const code2 = generateTestCode('import-csv-2');
      const csvContent = `code,title\n${code1},Import CSV Category 1\n${code2},Import CSV Category 2`;

      const result = await ctx.client.categories.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const categories = await ctx.client.categories.getAll(ctx.shopContext);
      const codes = categories.map((c) => c.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should import categories from CSV with semicolons', async () => {
      const code1 = generateTestCode('import-semi-1');
      const code2 = generateTestCode('import-semi-2');
      const csvContent = `code;title\n${code1};Import Semicolon Category 1\n${code2};Import Semicolon Category 2`;

      const result = await ctx.client.categories.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const categories = await ctx.client.categories.getAll(ctx.shopContext);
      const codes = categories.map((c) => c.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should handle Cyrillic characters in CSV', async () => {
      const csvContent = `code;title\nmavyko;Мавико\nmarshall;MARSHALL\nmazda;Mazda`;

      const result = await ctx.client.categories.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(3);
      expect(result.updated).toBe(0);

      const categories = await ctx.client.categories.getAll(ctx.shopContext);
      const mavyko = categories.find((c) => c.code === 'mavyko');
      expect(mavyko).toBeDefined();
      expect(mavyko?.title).toBe('Мавико');
    });

    it('should export categories to JSON', async () => {
      const code1 = generateTestCode('export-category-1');
      const code2 = generateTestCode('export-category-2');

      await ctx.client.categories.importJson(ctx.shopContext, [
        { code: code1, title: 'Export Test Category 1' },
        { code: code2, title: 'Export Test Category 2' },
      ]);

      const exported = await ctx.client.categories.exportJson(ctx.shopContext);

      expect(Array.isArray(exported)).toBe(true);
      const exportedCodes = exported.map((c) => c.code);
      expect(exportedCodes).toContain(normalizeCode(code1));
      expect(exportedCodes).toContain(normalizeCode(code2));

      const item = exported.find((c) => c.code === normalizeCode(code1));
      expect(item).toEqual({ code: normalizeCode(code1), title: 'Export Test Category 1' });
    });

    it('should export categories to CSV', async () => {
      const code1 = generateTestCode('csv-export-category-1');
      const code2 = generateTestCode('csv-export-category-2');

      await ctx.client.categories.importJson(ctx.shopContext, [
        { code: code1, title: 'CSV Export Test 1' },
        { code: code2, title: 'CSV Export Test 2' },
      ]);

      const csv = await ctx.client.categories.exportCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('code,title');
      expect(lines.some((line) => line.includes(normalizeCode(code1)))).toBe(true);
      expect(lines.some((line) => line.includes(normalizeCode(code2)))).toBe(true);
    });
  });

  describe('Example downloads', () => {
    it('should return JSON example', async () => {
      const examples = await ctx.client.categories.getExampleJson();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('code');
      expect(examples[0]).toHaveProperty('title');
    });

    it('should return CSV example', async () => {
      const csv = await ctx.client.categories.getExampleCsv();

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

      it('editor should list categories', async () => {
        const categories = await editorClient.categories.getAll(ctx.shopContext);
        expect(Array.isArray(categories)).toBe(true);
      });

      it('editor should create category', async () => {
        const category = await editorClient.categories.create(ctx.shopContext, {
          code: generateTestCode('editor-category'),
          title: 'Editor Category',
        });
        expect(category).toHaveProperty('id');
      });

      it('editor should get category by code', async () => {
        const categories = await editorClient.categories.getAll(ctx.shopContext);
        if (categories.length === 0) throw new Error('Expected at least one category for editor');
        const firstCategory = categories[0];
        if (!firstCategory) throw new Error('Expected category');
        const category = await editorClient.categories.getByCode(
          ctx.shopContext,
          firstCategory.code,
        );
        expect(category.id).toBe(firstCategory.id);
      });

      it('editor should update category', async () => {
        const categories = await editorClient.categories.getAll(ctx.shopContext);
        if (categories.length > 0) {
          const firstCategory = categories[0];
          if (!firstCategory) throw new Error('Expected category');
          const updated = await editorClient.categories.update(
            ctx.shopContext,
            firstCategory.id,
            { title: 'Editor Updated' },
          );
          expect(updated.title).toBe('Editor Updated');
        }
      });

      it('editor should delete category', async () => {
        const category = await editorClient.categories.create(ctx.shopContext, {
          code: generateTestCode('editor-delete'),
          title: 'To Delete',
        });
        await editorClient.categories.delete(ctx.shopContext, category.id);
        await expectNotFound(() =>
          editorClient.categories.getById(ctx.shopContext, category.id),
        );
      });

      it('editor should import categories', async () => {
        const result = await editorClient.categories.importJson(ctx.shopContext, [
          { code: generateTestCode('editor-import'), title: 'Editor Import' },
        ]);
        expect(result.created).toBe(1);
      });

      it('editor should export categories', async () => {
        const exported = await editorClient.categories.exportJson(ctx.shopContext);
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

      it('viewer should list categories', async () => {
        const categories = await viewerClient.categories.getAll(ctx.shopContext);
        expect(Array.isArray(categories)).toBe(true);
      });

      it('viewer should get category by code', async () => {
        const categories = await viewerClient.categories.getAll(ctx.shopContext);
        if (categories.length === 0) throw new Error('Expected at least one category for viewer');
        const firstCategory = categories[0];
        if (!firstCategory) throw new Error('Expected category');
        const category = await viewerClient.categories.getByCode(
          ctx.shopContext,
          firstCategory.code,
        );
        expect(category.id).toBe(firstCategory.id);
      });

      it('viewer should get category by id', async () => {
        const categories = await viewerClient.categories.getAll(ctx.shopContext);
        if (categories.length > 0) {
          const firstCategory = categories[0];
          if (!firstCategory) throw new Error('Expected category');
          const category = await viewerClient.categories.getById(
            ctx.shopContext,
            firstCategory.id,
          );
          expect(category.id).toBe(firstCategory.id);
        }
      });

      it('viewer should NOT create category', async () => {
        await expectForbidden(() =>
          viewerClient.categories.create(ctx.shopContext, {
            code: 'viewer-category',
            title: 'Should Fail',
          }),
        );
      });

      it('viewer should NOT update category', async () => {
        const categories = await viewerClient.categories.getAll(ctx.shopContext);
        if (categories.length > 0) {
          const firstCategory = categories[0];
          if (!firstCategory) throw new Error('Expected category');
          await expectForbidden(() =>
            viewerClient.categories.update(ctx.shopContext, firstCategory.id, {
              title: 'Should Fail',
            }),
          );
        }
      });

      it('viewer should NOT delete category', async () => {
        const categories = await viewerClient.categories.getAll(ctx.shopContext);
        if (categories.length > 0) {
          const firstCategory = categories[0];
          if (!firstCategory) throw new Error('Expected category');
          await expectForbidden(() =>
            viewerClient.categories.delete(ctx.shopContext, firstCategory.id),
          );
        }
      });

      it('viewer should export categories', async () => {
        const exported = await viewerClient.categories.exportJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('viewer should NOT import categories', async () => {
        await expectForbidden(() =>
          viewerClient.categories.importJson(ctx.shopContext, [
            { code: 'test', title: 'Should Fail' },
          ]),
        );
      });
    });
  });
});
