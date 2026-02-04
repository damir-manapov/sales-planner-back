import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { SalesPlannerClient, ApiError } from '@sales-planner/http-client';
import {
  cleanupUser,
  createUserWithApiKey,
  createTenantWithOwner,
  createShop,
  getOrCreateRole,
  assignRole,
  SYSTEM_ADMIN_KEY,
} from './test-helpers.js';

describe('SKUs (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let client: SalesPlannerClient;
  let systemClient: SalesPlannerClient;
  let tenantId: number;
  let shopId: number;
  let skuId: number;
  let testUserId: number;
  let testUserApiKey: string;

  const ctx = () => ({ shop_id: shopId, tenant_id: tenantId });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);

    const url = await app.getUrl();
    baseUrl = url.replace('[::1]', 'localhost');

    systemClient = new SalesPlannerClient({
      baseUrl,
      apiKey: SYSTEM_ADMIN_KEY,
    });

    // Create tenant with shop and user in one call
    const setup = await systemClient.createTenantWithShopAndUser({
      tenantTitle: `Test Tenant ${Date.now()}`,
      userEmail: `sku-test-${Date.now()}@example.com`,
      userName: 'SKU Test User',
    });

    testUserId = setup.user.id;
    testUserApiKey = setup.apiKey;
    tenantId = setup.tenant.id;
    shopId = setup.shop.id;

    client = new SalesPlannerClient({
      baseUrl,
      apiKey: testUserApiKey,
    });
  });

  afterAll(async () => {
    if (testUserId) {
      await cleanupUser(app, testUserId);
    }
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({
        baseUrl,
        apiKey: '',
      });

      try {
        await noAuthClient.getSkus(ctx());
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({
        baseUrl,
        apiKey: 'invalid-key',
      });

      try {
        await badClient.getSkus(ctx());
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });
  });

  describe('CRUD operations', () => {
    it('createSku - should create SKU', async () => {
      const newSku = {
        code: `SKU-${Date.now()}`,
        title: 'Test SKU',
      };

      const sku = await client.createSku(newSku, ctx());

      expect(sku).toHaveProperty('id');
      expect(sku.code).toBe(newSku.code);
      expect(sku.title).toBe(newSku.title);
      expect(sku.shop_id).toBe(shopId);
      expect(sku.tenant_id).toBe(tenantId);

      skuId = sku.id;
    });

    it('getSkus - should return SKUs for shop and tenant', async () => {
      const skus = await client.getSkus(ctx());

      expect(Array.isArray(skus)).toBe(true);
      expect(skus.length).toBeGreaterThan(0);
    });

    it('getSku - should return SKU by id', async () => {
      const sku = await client.getSku(skuId, ctx());

      expect(sku.id).toBe(skuId);
    });

    it('updateSku - should update SKU', async () => {
      const sku = await client.updateSku(skuId, { title: 'Updated SKU Title' }, ctx());

      expect(sku.title).toBe('Updated SKU Title');
    });
  });

  describe('Tenant-based access control', () => {
    it('should return 403 for wrong tenant', async () => {
      const otherUser = await createUserWithApiKey(
        app,
        `other-${Date.now()}@example.com`,
        'Other User',
      );
      const otherTenant = await createTenantWithOwner(
        app,
        `Other Tenant ${Date.now()}`,
        otherUser.userId,
      );
      const otherShop = await createShop(app, `Other Shop ${Date.now()}`, otherTenant.tenantId);

      try {
        await client.getSkus({ shop_id: otherShop.shopId, tenant_id: otherTenant.tenantId });
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }

      await cleanupUser(app, otherUser.userId);
    });

    it('should return 403 when creating SKU for wrong tenant', async () => {
      const otherUser = await createUserWithApiKey(
        app,
        `other2-${Date.now()}@example.com`,
        'Other User 2',
      );
      const otherTenant = await createTenantWithOwner(
        app,
        `Other Tenant ${Date.now()}`,
        otherUser.userId,
      );

      try {
        await client.createSku(
          { code: 'FORBIDDEN-SKU', title: 'Should Fail' },
          { shop_id: shopId, tenant_id: otherTenant.tenantId },
        );
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }

      await cleanupUser(app, otherUser.userId);
    });

    it('should return 404 for SKU in wrong tenant', async () => {
      const otherUser = await createUserWithApiKey(
        app,
        `other3-${Date.now()}@example.com`,
        'Other User 3',
      );
      const otherTenant = await createTenantWithOwner(
        app,
        `Other Tenant ${Date.now()}`,
        otherUser.userId,
      );
      const otherShop = await createShop(app, `Other Shop ${Date.now()}`, otherTenant.tenantId);

      const tenantAdminRoleId = await getOrCreateRole(app, 'tenantAdmin', 'Tenant Admin');
      await assignRole(app, testUserId, tenantAdminRoleId, { tenantId: otherTenant.tenantId });

      try {
        await client.getSku(skuId, { shop_id: otherShop.shopId, tenant_id: otherTenant.tenantId });
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }

      await cleanupUser(app, otherUser.userId);
    });
  });

  describe('Delete operations', () => {
    it('deleteSku - should delete SKU', async () => {
      await client.deleteSku(skuId, ctx());

      try {
        await client.getSku(skuId, ctx());
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }

      skuId = 0;
    });
  });

  describe('Import endpoints', () => {
    it('importSkusJson - should import SKUs from JSON', async () => {
      const code1 = `IMPORT-JSON-1-${Date.now()}`;
      const code2 = `IMPORT-JSON-2-${Date.now()}`;
      const items = [
        { code: code1, title: 'Import JSON SKU 1' },
        { code: code2, title: 'Import JSON SKU 2' },
      ];

      const result = await client.importSkusJson(items, ctx());

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      const skus = await client.getSkus(ctx());
      const codes = skus.map((s) => s.code);
      expect(codes).toContain(code1);
      expect(codes).toContain(code2);
    });

    it('importSkusJson - should upsert existing SKUs', async () => {
      const code = `UPSERT-JSON-${Date.now()}`;

      await client.importSkusJson([{ code, title: 'Original Title' }], ctx());

      const result = await client.importSkusJson([{ code, title: 'Updated Title' }], ctx());

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('importSkusCsv - should import SKUs from CSV', async () => {
      const code1 = `IMPORT-CSV-1-${Date.now()}`;
      const code2 = `IMPORT-CSV-2-${Date.now()}`;
      const csvContent = `code,title\n${code1},Import CSV SKU 1\n${code2},Import CSV SKU 2`;

      const result = await client.importSkusCsv(csvContent, ctx());

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const skus = await client.getSkus(ctx());
      const codes = skus.map((s) => s.code);
      expect(codes).toContain(code1);
      expect(codes).toContain(code2);
    });

    it('exportSkusJson - should export SKUs in import format', async () => {
      const code1 = `EXPORT-SKU-1-${Date.now()}`;
      const code2 = `EXPORT-SKU-2-${Date.now()}`;

      await client.importSkusJson(
        [
          { code: code1, title: 'Export Test SKU 1' },
          { code: code2, title: 'Export Test SKU 2' },
        ],
        ctx(),
      );

      const exported = await client.exportSkusJson(ctx());

      expect(Array.isArray(exported)).toBe(true);
      const exportedCodes = exported.map((s) => s.code);
      expect(exportedCodes).toContain(code1);
      expect(exportedCodes).toContain(code2);

      const item = exported.find((s) => s.code === code1);
      expect(item).toEqual({ code: code1, title: 'Export Test SKU 1' });
    });

    it('exportSkusCsv - should export SKUs in CSV format', async () => {
      const code1 = `CSV-EXPORT-SKU-1-${Date.now()}`;
      const code2 = `CSV-EXPORT-SKU-2-${Date.now()}`;

      await client.importSkusJson(
        [
          { code: code1, title: 'CSV Export Test 1' },
          { code: code2, title: 'CSV Export Test 2' },
        ],
        ctx(),
      );

      const csv = await client.exportSkusCsv(ctx());

      expect(typeof csv).toBe('string');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('code,title');
      expect(lines.some((line) => line.includes(code1))).toBe(true);
      expect(lines.some((line) => line.includes(code2))).toBe(true);
    });
  });

  describe('Viewer role access', () => {
    let viewerUserId: number;
    let viewerClient: SalesPlannerClient;

    beforeAll(async () => {
      const viewer = await createUserWithApiKey(
        app,
        `viewer-${Date.now()}@example.com`,
        'Viewer User',
      );
      viewerUserId = viewer.userId;

      viewerClient = new SalesPlannerClient({
        baseUrl,
        apiKey: viewer.apiKey,
      });

      const viewerRoleId = await getOrCreateRole(app, 'viewer', 'Viewer user');
      await assignRole(app, viewerUserId, viewerRoleId, { tenantId, shopId });
    });

    afterAll(async () => {
      if (viewerUserId) {
        await cleanupUser(app, viewerUserId);
      }
    });

    it('viewer should be able to list SKUs', async () => {
      const skus = await viewerClient.getSkus(ctx());

      expect(Array.isArray(skus)).toBe(true);
    });

    it('viewer should not be able to create SKUs', async () => {
      try {
        await viewerClient.createSku({ code: 'VIEWER-CREATE', title: 'Should Fail' }, ctx());
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });

    it('viewer should not be able to import', async () => {
      try {
        await viewerClient.importSkusJson([{ code: 'VIEWER-IMPORT', title: 'Should Fail' }], ctx());
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });
  });

  describe('Example downloads', () => {
    it('getSkusExampleJson - should return JSON example', async () => {
      const example = await client.getSkusExampleJson();

      expect(Array.isArray(example)).toBe(true);
      expect(example.length).toBeGreaterThan(0);
      expect(example[0]).toHaveProperty('code');
      expect(example[0]).toHaveProperty('title');
    });

    it('getSkusExampleCsv - should return CSV example', async () => {
      const csv = await client.getSkusExampleCsv();

      expect(typeof csv).toBe('string');
      expect(csv).toContain('code,title');
      expect(csv).toContain('SKU-001');
    });
  });

  describe('Tenant owner access (derived role)', () => {
    let ownerUserId: number;
    let ownerClient: SalesPlannerClient;
    let ownerTenantId: number;
    let ownerShopId: number;

    const ownerCtx = () => ({ shop_id: ownerShopId, tenant_id: ownerTenantId });

    beforeAll(async () => {
      const owner = await createUserWithApiKey(
        app,
        `owner-${Date.now()}@example.com`,
        'Tenant Owner User',
      );
      ownerUserId = owner.userId;

      ownerClient = new SalesPlannerClient({
        baseUrl,
        apiKey: owner.apiKey,
      });

      const tenant = await createTenantWithOwner(app, `Owner Tenant ${Date.now()}`, ownerUserId);
      ownerTenantId = tenant.tenantId;

      const shop = await createShop(app, `Owner Shop ${Date.now()}`, ownerTenantId);
      ownerShopId = shop.shopId;
    });

    afterAll(async () => {
      if (ownerUserId) {
        await cleanupUser(app, ownerUserId);
      }
    });

    it('tenant owner should have read access without explicit role', async () => {
      const skus = await ownerClient.getSkus(ownerCtx());

      expect(Array.isArray(skus)).toBe(true);
    });

    it('tenant owner should have write access without explicit role', async () => {
      const sku = await ownerClient.createSku(
        { code: 'OWNER-SKU', title: 'Owner Created SKU' },
        ownerCtx(),
      );

      expect(sku).toHaveProperty('id');

      await ownerClient.deleteSku(sku.id, ownerCtx());
    });

    it('tenant owner should be able to import', async () => {
      const result = await ownerClient.importSkusJson(
        [{ code: 'OWNER-IMPORT-1', title: 'Owner Import 1' }],
        ownerCtx(),
      );

      expect(result.created + result.updated).toBe(1);
    });

    it('tenant owner should NOT access other tenants', async () => {
      try {
        await ownerClient.getSkus(ctx());
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });
  });
});
