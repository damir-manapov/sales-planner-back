import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError, SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { normalizeCode } from '../src/lib/normalize-code.js';
import { TestContext } from './test-context.js';
import { cleanupUser } from './test-helpers.js';

describe('Categorys (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let categoryId: number;

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
      tenantTitle: `Test Tenant ${Date.now()}`,
      userEmail: `category-test-${Date.now()}@example.com`,
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

      try {
        await noAuthClient.getCategories(ctx.shopContext);
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });

      try {
        await badClient.getCategories(ctx.shopContext);
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });
  });

  describe('CRUD operations', () => {
    it('createCategory - should create category', async () => {
      const newCategory = { code: `category-${Date.now()}`, title: 'Test Category' };
      const category = await ctx.client.createCategory(newCategory, ctx.shopContext);

      expect(category).toHaveProperty('id');
      expect(category.code).toBe(normalizeCode(newCategory.code));
      expect(category.title).toBe(newCategory.title);
      expect(category.shop_id).toBe(ctx.shop.id);
      expect(category.tenant_id).toBe(ctx.tenant.id);

      categoryId = category.id;
    });

    it('getCategories - should return categories for shop and tenant', async () => {
      const categories = await ctx.client.getCategories(ctx.shopContext);

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('getCategory - should return category by id', async () => {
      const category = await ctx.client.getCategory(categoryId, ctx.shopContext);

      expect(category.id).toBe(categoryId);
    });

    it('updateCategory - should update category', async () => {
      const category = await ctx.client.updateCategory(
        categoryId,
        { title: 'Updated Category Title' },
        ctx.shopContext,
      );

      expect(category.title).toBe('Updated Category Title');
    });

    it('createCategory - should return 409 on duplicate code in same shop', async () => {
      const duplicateCode = `category-${Date.now()}`;
      await ctx.client.createCategory({ code: duplicateCode, title: 'First Category' }, ctx.shopContext);

      try {
        await ctx.client.createCategory(
          { code: duplicateCode, title: 'Duplicate Category' },
          ctx.shopContext,
        );
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(409);
      }
    });
  });

  describe('Tenant-based access control', () => {
    it('should return 403 for wrong tenant', async () => {
      // Create another user with their own tenant
      const otherSetup = await ctx.getSystemClient().createTenantWithShopAndUser({
        tenantTitle: `Other Tenant ${Date.now()}`,
        userEmail: `other-${Date.now()}@example.com`,
        userName: 'Other User',
      });

      try {
        await ctx.client.getCategories({
          shop_id: otherSetup.shop.id,
          tenant_id: otherSetup.tenant.id,
        });
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }

      await cleanupUser(app, otherSetup.user.id);
    });

    it('should return 403 when creating category for wrong tenant', async () => {
      const otherSetup = await ctx.getSystemClient().createTenantWithShopAndUser({
        tenantTitle: `Other Tenant ${Date.now()}`,
        userEmail: `other2-${Date.now()}@example.com`,
        userName: 'Other User 2',
      });

      try {
        await ctx.client.createCategory(
          { code: 'forbidden-category', title: 'Should Fail' },
          { shop_id: ctx.shop.id, tenant_id: otherSetup.tenant.id },
        );
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }

      await cleanupUser(app, otherSetup.user.id);
    });

    it('should return 404 for category in wrong tenant', async () => {
      const otherSetup = await ctx.getSystemClient().createTenantWithShopAndUser({
        tenantTitle: `Other Tenant ${Date.now()}`,
        userEmail: `other3-${Date.now()}@example.com`,
        userName: 'Other User 3',
      });

      // Give test user access to the other tenant
      const roles = await ctx.getSystemClient().getRoles();
      const tenantAdminRole = roles.find((r) => r.name === 'tenantAdmin');
      if (tenantAdminRole) {
        await ctx.getSystemClient().createUserRole({
          user_id: ctx.user.id,
          role_id: tenantAdminRole.id,
          tenant_id: otherSetup.tenant.id,
        });
      }

      try {
        await ctx.client.getCategory(categoryId, {
          shop_id: otherSetup.shop.id,
          tenant_id: otherSetup.tenant.id,
        });
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }

      await cleanupUser(app, otherSetup.user.id);
    });
  });

  describe('Delete operations', () => {
    it('deleteCategory - should delete category', async () => {
      await ctx.client.deleteCategory(categoryId, ctx.shopContext);

      try {
        await ctx.client.getCategory(categoryId, ctx.shopContext);
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }

      categoryId = 0;
    });
  });

  describe('Import endpoints', () => {
    it('importCategoriesJson - should import categories from JSON', async () => {
      const code1 = `import-json-1-${Date.now()}`;
      const code2 = `import-json-2-${Date.now()}`;
      const items = [
        { code: code1, title: 'Import JSON Category 1' },
        { code: code2, title: 'Import JSON Category 2' },
      ];

      const result = await ctx.client.importCategoriesJson(items, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      const categories = await ctx.client.getCategories(ctx.shopContext);
      const codes = categories.map((b) => b.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('importCategoriesJson - should upsert existing categories', async () => {
      const code = `upsert-json-${Date.now()}`;

      await ctx.client.importCategoriesJson([{ code, title: 'Original Title' }], ctx.shopContext);
      const result = await ctx.client.importCategoriesJson(
        [{ code, title: 'Updated Title' }],
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('importCategoriesCsv - should import categories from CSV with commas', async () => {
      const code1 = `import-csv-1-${Date.now()}`;
      const code2 = `import-csv-2-${Date.now()}`;
      const csvContent = `code,title\n${code1},Import CSV Category 1\n${code2},Import CSV Category 2`;

      const result = await ctx.client.importCategoriesCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const categories = await ctx.client.getCategories(ctx.shopContext);
      const codes = categories.map((b) => b.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('importCategoriesCsv - should import categories from CSV with semicolons', async () => {
      const code1 = `import-semi-1-${Date.now()}`;
      const code2 = `import-semi-2-${Date.now()}`;
      const csvContent = `code;title\n${code1};Import Semicolon Category 1\n${code2};Import Semicolon Category 2`;

      const result = await ctx.client.importCategoriesCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const categories = await ctx.client.getCategories(ctx.shopContext);
      const codes = categories.map((b) => b.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('importCategoriesCsv - should handle Cyrillic characters with semicolons', async () => {
      const csvContent = `code;title\nmavyko;Мавико\nmarshall;MARSHALL\nmazda;Mazda`;

      const result = await ctx.client.importCategoriesCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(3);
      expect(result.updated).toBe(0);

      const categories = await ctx.client.getCategories(ctx.shopContext);
      const mavyko = categories.find((b) => b.code === 'mavyko');
      expect(mavyko).toBeDefined();
      expect(mavyko?.title).toBe('Мавико');
    });

    it('exportCategoriesJson - should export categories in import format', async () => {
      const code1 = `export-category-1-${Date.now()}`;
      const code2 = `export-category-2-${Date.now()}`;

      await ctx.client.importCategoriesJson(
        [
          { code: code1, title: 'Export Test Category 1' },
          { code: code2, title: 'Export Test Category 2' },
        ],
        ctx.shopContext,
      );

      const exported = await ctx.client.exportCategoriesJson(ctx.shopContext);

      expect(Array.isArray(exported)).toBe(true);
      const exportedCodes = exported.map((b) => b.code);
      expect(exportedCodes).toContain(normalizeCode(code1));
      expect(exportedCodes).toContain(normalizeCode(code2));

      const item = exported.find((b) => b.code === normalizeCode(code1));
      expect(item).toEqual({ code: normalizeCode(code1), title: 'Export Test Category 1' });
    });

    it('exportCategoriesCsv - should export categories in CSV format', async () => {
      const code1 = `csv-export-category-1-${Date.now()}`;
      const code2 = `csv-export-category-2-${Date.now()}`;

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

  describe('Viewer role access', () => {
    let viewerUserId: number;
    let viewerClient: SalesPlannerClient;

    beforeAll(async () => {
      // Create viewer user
      const viewerUser = await ctx.getSystemClient().createUser({
        email: `viewer-${Date.now()}@example.com`,
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

    it('viewer should be able to list categories', async () => {
      const categories = await viewerClient.getCategories(ctx.shopContext);

      expect(Array.isArray(categories)).toBe(true);
    });

    it('viewer should be able to get single category', async () => {
      const categories = await viewerClient.getCategories(ctx.shopContext);
      if (categories.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length check ensures element exists
        const firstCategory = categories[0]!;
        const category = await viewerClient.getCategory(firstCategory.id, ctx.shopContext);
        expect(category.id).toBe(firstCategory.id);
      }
    });

    it('viewer should NOT be able to create category', async () => {
      try {
        await viewerClient.createCategory(
          { code: 'viewer-category', title: 'Should Fail' },
          ctx.shopContext,
        );
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });

    it('viewer should NOT be able to update category', async () => {
      const categories = await viewerClient.getCategories(ctx.shopContext);
      if (categories.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length check ensures element exists
        const firstCategory = categories[0]!;
        try {
          await viewerClient.updateCategory(firstCategory.id, { title: 'Should Fail' }, ctx.shopContext);
          expect.fail('Should have thrown ApiError');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(403);
        }
      }
    });

    it('viewer should NOT be able to delete category', async () => {
      const categories = await viewerClient.getCategories(ctx.shopContext);
      if (categories.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length check ensures element exists
        const firstCategory = categories[0]!;
        try {
          await viewerClient.deleteCategory(firstCategory.id, ctx.shopContext);
          expect.fail('Should have thrown ApiError');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(403);
        }
      }
    });

    it('viewer should be able to export categories', async () => {
      const exported = await viewerClient.exportCategoriesJson(ctx.shopContext);
      expect(Array.isArray(exported)).toBe(true);
    });

    it('viewer should NOT be able to import categories', async () => {
      try {
        await viewerClient.importCategoriesJson(
          [{ code: 'test', title: 'Should Fail' }],
          ctx.shopContext,
        );
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });
  });
});
