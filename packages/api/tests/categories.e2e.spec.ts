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
      await expectUnauthorized(() => noAuthClient.getCategories(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.getCategories(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create category', async () => {
      const newCategory = { code: generateTestCode('category'), title: 'Test Category' };
      const category = await ctx.client.createCategory(newCategory, ctx.shopContext);

      expect(category).toHaveProperty('id');
      expect(category.code).toBe(normalizeCode(newCategory.code));
      expect(category.title).toBe(newCategory.title);
      expect(category.shop_id).toBe(ctx.shop.id);
      expect(category.tenant_id).toBe(ctx.tenant.id);
    });

    it('should list categories', async () => {
      await ctx.client.createCategory(
        { code: generateTestCode('category-list'), title: 'List Category' },
        ctx.shopContext,
      );

      const categories = await ctx.client.getCategories(ctx.shopContext);

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should get category by id', async () => {
      const created = await ctx.client.createCategory(
        { code: generateTestCode('category-get'), title: 'Get Category' },
        ctx.shopContext,
      );

      const category = await ctx.client.getCategory(created.id, ctx.shopContext);

      expect(category.id).toBe(created.id);
    });

    it('should get category by code', async () => {
      const created = await ctx.client.createCategory(
        { code: generateTestCode('category-get-code'), title: 'Get Category Code' },
        ctx.shopContext,
      );

      const category = await ctx.client.getCategoryByCode(created.code, ctx.shopContext);

      expect(category.id).toBe(created.id);
      expect(category.code).toBe(created.code);
    });

    it('should update category', async () => {
      const created = await ctx.client.createCategory(
        { code: generateTestCode('category-update'), title: 'To Update' },
        ctx.shopContext,
      );

      const category = await ctx.client.updateCategory(
        created.id,
        { title: 'Updated Category Title' },
        ctx.shopContext,
      );

      expect(category.title).toBe('Updated Category Title');
    });

    it('should return 409 on duplicate code', async () => {
      const duplicateCode = generateTestCode('category');
      await ctx.client.createCategory(
        { code: duplicateCode, title: 'First Category' },
        ctx.shopContext,
      );

      await expectConflict(() =>
        ctx.client.createCategory(
          { code: duplicateCode, title: 'Duplicate Category' },
          ctx.shopContext,
        ),
      );
    });
  });

  describe('Delete operations', () => {
    it('should delete category', async () => {
      const toDelete = await ctx.client.createCategory(
        { code: generateTestCode('category-delete'), title: 'Delete Category' },
        ctx.shopContext,
      );

      await ctx.client.deleteCategory(toDelete.id, ctx.shopContext);
      await expectNotFound(() => ctx.client.getCategory(toDelete.id, ctx.shopContext));
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
        ctx.client.getCategories({
          shop_id: otherCtx.shop.id,
          tenant_id: otherCtx.tenant.id,
        }),
      );
    });

    it('should return 403 when creating for other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.createCategory(
          { code: 'forbidden-category', title: 'Should Fail' },
          { shop_id: ctx.shop.id, tenant_id: otherCtx.tenant.id },
        ),
      );
    });

    it('should return 404 when getting resource from other tenant', async () => {
      const otherCategory = await otherCtx.client.createCategory(
        { code: generateTestCode('other'), title: 'Other Category' },
        otherCtx.shopContext,
      );

      await expectNotFound(() => ctx.client.getCategory(otherCategory.id, ctx.shopContext));
    });

    it('should allow same code in different tenants', async () => {
      const sharedCode = generateTestCode('shared');

      const category1 = await ctx.client.createCategory(
        { code: sharedCode, title: 'Category in Tenant 1' },
        ctx.shopContext,
      );
      const category2 = await otherCtx.client.createCategory(
        { code: sharedCode, title: 'Category in Tenant 2' },
        otherCtx.shopContext,
      );

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

      const result = await ctx.client.importCategoriesJson(items, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      const categories = await ctx.client.getCategories(ctx.shopContext);
      const codes = categories.map((c) => c.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should upsert existing categories on import', async () => {
      const code = generateTestCode('upsert-json');

      await ctx.client.importCategoriesJson([{ code, title: 'Original Title' }], ctx.shopContext);
      const result = await ctx.client.importCategoriesJson(
        [{ code, title: 'Updated Title' }],
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should import categories from CSV with commas', async () => {
      const code1 = generateTestCode('import-csv-1');
      const code2 = generateTestCode('import-csv-2');
      const csvContent = `code,title\n${code1},Import CSV Category 1\n${code2},Import CSV Category 2`;

      const result = await ctx.client.importCategoriesCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const categories = await ctx.client.getCategories(ctx.shopContext);
      const codes = categories.map((c) => c.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should import categories from CSV with semicolons', async () => {
      const code1 = generateTestCode('import-semi-1');
      const code2 = generateTestCode('import-semi-2');
      const csvContent = `code;title\n${code1};Import Semicolon Category 1\n${code2};Import Semicolon Category 2`;

      const result = await ctx.client.importCategoriesCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const categories = await ctx.client.getCategories(ctx.shopContext);
      const codes = categories.map((c) => c.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should handle Cyrillic characters in CSV', async () => {
      const csvContent = `code;title\nmavyko;Мавико\nmarshall;MARSHALL\nmazda;Mazda`;

      const result = await ctx.client.importCategoriesCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(3);
      expect(result.updated).toBe(0);

      const categories = await ctx.client.getCategories(ctx.shopContext);
      const mavyko = categories.find((c) => c.code === 'mavyko');
      expect(mavyko).toBeDefined();
      expect(mavyko?.title).toBe('Мавико');
    });

    it('should export categories to JSON', async () => {
      const code1 = generateTestCode('export-category-1');
      const code2 = generateTestCode('export-category-2');

      await ctx.client.importCategoriesJson(
        [
          { code: code1, title: 'Export Test Category 1' },
          { code: code2, title: 'Export Test Category 2' },
        ],
        ctx.shopContext,
      );

      const exported = await ctx.client.exportCategoriesJson(ctx.shopContext);

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

      await ctx.client.importCategoriesJson(
        [
          { code: code1, title: 'CSV Export Test 1' },
          { code: code2, title: 'CSV Export Test 2' },
        ],
        ctx.shopContext,
      );

      const csv = await ctx.client.exportCategoriesCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('code,title');
      expect(lines.some((line) => line.includes(normalizeCode(code1)))).toBe(true);
      expect(lines.some((line) => line.includes(normalizeCode(code2)))).toBe(true);
    });
  });

  describe('Example downloads', () => {
    it('should return JSON example', async () => {
      const examples = await ctx.client.getCategoriesExampleJson();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('code');
      expect(examples[0]).toHaveProperty('title');
    });

    it('should return CSV example', async () => {
      const csv = await ctx.client.getCategoriesExampleCsv();

      expect(typeof csv).toBe('string');
      expect(csv).toContain('code,title');
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

      it('editor should list categories', async () => {
        const categories = await editorClient.getCategories(ctx.shopContext);
        expect(Array.isArray(categories)).toBe(true);
      });

      it('editor should create category', async () => {
        const category = await editorClient.createCategory(
          { code: generateTestCode('editor-category'), title: 'Editor Category' },
          ctx.shopContext,
        );
        expect(category).toHaveProperty('id');
      });

      it('editor should update category', async () => {
        const categories = await editorClient.getCategories(ctx.shopContext);
        if (categories.length > 0) {
          const firstCategory = categories[0];
          if (!firstCategory) throw new Error('Expected category');
          const updated = await editorClient.updateCategory(
            firstCategory.id,
            { title: 'Editor Updated' },
            ctx.shopContext,
          );
          expect(updated.title).toBe('Editor Updated');
        }
      });

      it('editor should delete category', async () => {
        const category = await editorClient.createCategory(
          { code: generateTestCode('editor-delete'), title: 'To Delete' },
          ctx.shopContext,
        );
        await editorClient.deleteCategory(category.id, ctx.shopContext);
        await expectNotFound(() => editorClient.getCategory(category.id, ctx.shopContext));
      });

      it('editor should import categories', async () => {
        const result = await editorClient.importCategoriesJson(
          [{ code: generateTestCode('editor-import'), title: 'Editor Import' }],
          ctx.shopContext,
        );
        expect(result.created).toBe(1);
      });

      it('editor should export categories', async () => {
        const exported = await editorClient.exportCategoriesJson(ctx.shopContext);
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

      it('viewer should list categories', async () => {
        const categories = await viewerClient.getCategories(ctx.shopContext);
        expect(Array.isArray(categories)).toBe(true);
      });

      it('viewer should get category by id', async () => {
        const categories = await viewerClient.getCategories(ctx.shopContext);
        if (categories.length > 0) {
          const firstCategory = categories[0];
          if (!firstCategory) throw new Error('Expected category');
          const category = await viewerClient.getCategory(firstCategory.id, ctx.shopContext);
          expect(category.id).toBe(firstCategory.id);
        }
      });

      it('viewer should NOT create category', async () => {
        await expectForbidden(() =>
          viewerClient.createCategory(
            { code: 'viewer-category', title: 'Should Fail' },
            ctx.shopContext,
          ),
        );
      });

      it('viewer should NOT update category', async () => {
        const categories = await viewerClient.getCategories(ctx.shopContext);
        if (categories.length > 0) {
          const firstCategory = categories[0];
          if (!firstCategory) throw new Error('Expected category');
          await expectForbidden(() =>
            viewerClient.updateCategory(
              firstCategory.id,
              { title: 'Should Fail' },
              ctx.shopContext,
            ),
          );
        }
      });

      it('viewer should NOT delete category', async () => {
        const categories = await viewerClient.getCategories(ctx.shopContext);
        if (categories.length > 0) {
          const firstCategory = categories[0];
          if (!firstCategory) throw new Error('Expected category');
          await expectForbidden(() =>
            viewerClient.deleteCategory(firstCategory.id, ctx.shopContext),
          );
        }
      });

      it('viewer should export categories', async () => {
        const exported = await viewerClient.exportCategoriesJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('viewer should NOT import categories', async () => {
        await expectForbidden(() =>
          viewerClient.importCategoriesJson(
            [{ code: 'test', title: 'Should Fail' }],
            ctx.shopContext,
          ),
        );
      });
    });
  });
});
