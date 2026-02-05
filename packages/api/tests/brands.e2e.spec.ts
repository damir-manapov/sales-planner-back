import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { normalizeCode } from '../src/lib/normalize-code.js';
import { TestContext } from './test-context.js';
import {
  cleanupUser,
  generateUniqueId,
  generateTestCode,
  expectUnauthorized,
  expectForbidden,
  expectNotFound,
  expectConflict,
} from './test-helpers.js';

describe('Brands (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let brandId: number;

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
      await expectUnauthorized(() => noAuthClient.getBrands(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.getBrands(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('createBrand - should create brand', async () => {
      const newBrand = { code: generateTestCode('brand'), title: 'Test Brand' };
      const brand = await ctx.client.createBrand(newBrand, ctx.shopContext);

      expect(brand).toHaveProperty('id');
      expect(brand.code).toBe(normalizeCode(newBrand.code));
      expect(brand.title).toBe(newBrand.title);
      expect(brand.shop_id).toBe(ctx.shop.id);
      expect(brand.tenant_id).toBe(ctx.tenant.id);

      brandId = brand.id;
    });

    it('getBrands - should return brands for shop and tenant', async () => {
      const brands = await ctx.client.getBrands(ctx.shopContext);

      expect(Array.isArray(brands)).toBe(true);
      expect(brands.length).toBeGreaterThan(0);
    });

    it('getBrand - should return brand by id', async () => {
      const brand = await ctx.client.getBrand(brandId, ctx.shopContext);

      expect(brand.id).toBe(brandId);
    });

    it('updateBrand - should update brand', async () => {
      const brand = await ctx.client.updateBrand(
        brandId,
        { title: 'Updated Brand Title' },
        ctx.shopContext,
      );

      expect(brand.title).toBe('Updated Brand Title');
    });

    it('createBrand - should return 409 on duplicate code in same shop', async () => {
      const duplicateCode = generateTestCode('brand');
      await ctx.client.createBrand({ code: duplicateCode, title: 'First Brand' }, ctx.shopContext);

      await expectConflict(() =>
        ctx.client.createBrand(
          { code: duplicateCode, title: 'Duplicate Brand' },
          ctx.shopContext,
        ),
      );
    });
  });

  describe('Tenant-based access control', () => {
    it('should return 403 for wrong tenant', async () => {
      // Create another user with their own tenant
      const otherSetup = await ctx.getSystemClient().createTenantWithShopAndUser({
        tenantTitle: `Other Tenant ${generateUniqueId()}`,
        userEmail: `other-${generateUniqueId()}@example.com`,
        userName: 'Other User',
      });

      await expectForbidden(() =>
        ctx.client.getBrands({
          shop_id: otherSetup.shop.id,
          tenant_id: otherSetup.tenant.id,
        }),
      );

      await cleanupUser(app, otherSetup.user.id);
    });

    it('should return 403 when creating brand for wrong tenant', async () => {
      const otherSetup = await ctx.getSystemClient().createTenantWithShopAndUser({
        tenantTitle: `Other Tenant ${generateUniqueId()}`,
        userEmail: `other2-${generateUniqueId()}@example.com`,
        userName: 'Other User 2',
      });

      await expectForbidden(() =>
        ctx.client.createBrand(
          { code: 'forbidden-brand', title: 'Should Fail' },
          { shop_id: ctx.shop.id, tenant_id: otherSetup.tenant.id },
        ),
      );

      await cleanupUser(app, otherSetup.user.id);
    });

    it('should return 404 for brand in wrong tenant', async () => {
      const otherSetup = await ctx.getSystemClient().createTenantWithShopAndUser({
        tenantTitle: `Other Tenant ${generateUniqueId()}`,
        userEmail: `other3-${generateUniqueId()}@example.com`,
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

      await expectNotFound(() =>
        ctx.client.getBrand(brandId, {
          shop_id: otherSetup.shop.id,
          tenant_id: otherSetup.tenant.id,
        }),
      );

      await cleanupUser(app, otherSetup.user.id);
    });
  });

  describe('Delete operations', () => {
    it('deleteBrand - should delete brand', async () => {
      await ctx.client.deleteBrand(brandId, ctx.shopContext);
      await expectNotFound(() => ctx.client.getBrand(brandId, ctx.shopContext));
    });
  });

  describe('Import endpoints', () => {
    it('importBrandsJson - should import brands from JSON', async () => {
      const code1 = generateTestCode('import-json-1');
      const code2 = generateTestCode('import-json-2');
      const items = [
        { code: code1, title: 'Import JSON Brand 1' },
        { code: code2, title: 'Import JSON Brand 2' },
      ];

      const result = await ctx.client.importBrandsJson(items, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      const brands = await ctx.client.getBrands(ctx.shopContext);
      const codes = brands.map((b) => b.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('importBrandsJson - should upsert existing brands', async () => {
      const code = generateTestCode('upsert-json');

      await ctx.client.importBrandsJson([{ code, title: 'Original Title' }], ctx.shopContext);
      const result = await ctx.client.importBrandsJson(
        [{ code, title: 'Updated Title' }],
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('importBrandsCsv - should import brands from CSV with commas', async () => {
      const code1 = generateTestCode('import-csv-1');
      const code2 = generateTestCode('import-csv-2');
      const csvContent = `code,title\n${code1},Import CSV Brand 1\n${code2},Import CSV Brand 2`;

      const result = await ctx.client.importBrandsCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const brands = await ctx.client.getBrands(ctx.shopContext);
      const codes = brands.map((b) => b.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('importBrandsCsv - should import brands from CSV with semicolons', async () => {
      const code1 = generateTestCode('import-semi-1');
      const code2 = generateTestCode('import-semi-2');
      const csvContent = `code;title\n${code1};Import Semicolon Brand 1\n${code2};Import Semicolon Brand 2`;

      const result = await ctx.client.importBrandsCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const brands = await ctx.client.getBrands(ctx.shopContext);
      const codes = brands.map((b) => b.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('importBrandsCsv - should handle Cyrillic characters with semicolons', async () => {
      const csvContent = `code;title\nmavyko;Мавико\nmarshall;MARSHALL\nmazda;Mazda`;

      const result = await ctx.client.importBrandsCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(3);
      expect(result.updated).toBe(0);

      const brands = await ctx.client.getBrands(ctx.shopContext);
      const mavyko = brands.find((b) => b.code === 'mavyko');
      expect(mavyko).toBeDefined();
      expect(mavyko?.title).toBe('Мавико');
    });

    it('exportBrandsJson - should export brands in import format', async () => {
      const code1 = generateTestCode('export-brand-1');
      const code2 = generateTestCode('export-brand-2');

      await ctx.client.importBrandsJson(
        [
          { code: code1, title: 'Export Test Brand 1' },
          { code: code2, title: 'Export Test Brand 2' },
        ],
        ctx.shopContext,
      );

      const exported = await ctx.client.exportBrandsJson(ctx.shopContext);

      expect(Array.isArray(exported)).toBe(true);
      const exportedCodes = exported.map((b) => b.code);
      expect(exportedCodes).toContain(normalizeCode(code1));
      expect(exportedCodes).toContain(normalizeCode(code2));

      const item = exported.find((b) => b.code === normalizeCode(code1));
      expect(item).toEqual({ code: normalizeCode(code1), title: 'Export Test Brand 1' });
    });

    it('exportBrandsCsv - should export brands in CSV format', async () => {
      const code1 = generateTestCode('csv-export-brand-1');
      const code2 = generateTestCode('csv-export-brand-2');

      await ctx.client.importBrandsJson(
        [
          { code: code1, title: 'CSV Export Test 1' },
          { code: code2, title: 'CSV Export Test 2' },
        ],
        ctx.shopContext,
      );

      const csv = await ctx.client.exportBrandsCsv(ctx.shopContext);

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

    it('viewer should be able to list brands', async () => {
      const brands = await viewerClient.getBrands(ctx.shopContext);

      expect(Array.isArray(brands)).toBe(true);
    });

    it('viewer should be able to get single brand', async () => {
      const brands = await viewerClient.getBrands(ctx.shopContext);
      if (brands.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length check ensures element exists
        const firstBrand = brands[0]!;
        const brand = await viewerClient.getBrand(firstBrand.id, ctx.shopContext);
        expect(brand.id).toBe(firstBrand.id);
      }
    });

    it('viewer should NOT be able to create brand', async () => {
      await expectForbidden(() =>
        viewerClient.createBrand(
          { code: 'viewer-brand', title: 'Should Fail' },
          ctx.shopContext,
        ),
      );
    });

    it('viewer should NOT be able to update brand', async () => {
      const brands = await viewerClient.getBrands(ctx.shopContext);
      if (brands.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length check ensures element exists
        const firstBrand = brands[0]!;
        await expectForbidden(() =>
          viewerClient.updateBrand(firstBrand.id, { title: 'Should Fail' }, ctx.shopContext),
        );
      }
    });

    it('viewer should NOT be able to delete brand', async () => {
      const brands = await viewerClient.getBrands(ctx.shopContext);
      if (brands.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length check ensures element exists
        const firstBrand = brands[0]!;
        await expectForbidden(() => viewerClient.deleteBrand(firstBrand.id, ctx.shopContext));
      }
    });

    it('viewer should be able to export brands', async () => {
      const exported = await viewerClient.exportBrandsJson(ctx.shopContext);
      expect(Array.isArray(exported)).toBe(true);
    });

    it('viewer should NOT be able to import brands', async () => {
      await expectForbidden(() =>
        viewerClient.importBrandsJson(
          [{ code: 'test', title: 'Should Fail' }],
          ctx.shopContext,
        ),
      );
    });
  });
});
