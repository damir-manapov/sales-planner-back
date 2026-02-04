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

describe('SKUs with HTTP Client (e2e)', () => {
  let app: INestApplication;
  let client: SalesPlannerClient;
  let systemClient: SalesPlannerClient;
  let tenantId: number;
  let shopId: number;
  let skuId: number;
  let testUserId: number;
  let testUserApiKey: string;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0); // Listen on random available port

    // Get the base URL from the server
    const url = await app.getUrl();
    baseUrl = url.replace('[::1]', 'localhost');

    // Initialize system admin client
    systemClient = new SalesPlannerClient({
      baseUrl,
      apiKey: SYSTEM_ADMIN_KEY,
    });

    // Create tenant with shop and user in one call using the client
    const setup = await systemClient.createTenantWithShopAndUser({
      tenantTitle: `Test Tenant ${Date.now()}`,
      userEmail: `sku-client-test-${Date.now()}@example.com`,
      userName: 'SKU Client Test User',
    });

    testUserId = setup.user.id;
    testUserApiKey = setup.apiKey;
    tenantId = setup.tenant.id;
    shopId = setup.shop.id;

    // Initialize user client
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
    it('should throw ApiError without valid API key', async () => {
      const badClient = new SalesPlannerClient({
        baseUrl,
        apiKey: 'invalid-key',
      });

      await expect(
        badClient.getSkus({ shop_id: shopId, tenant_id: tenantId }),
      ).rejects.toThrow(ApiError);

      try {
        await badClient.getSkus({ shop_id: shopId, tenant_id: tenantId });
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

      const sku = await client.createSku(newSku, {
        shop_id: shopId,
        tenant_id: tenantId,
      });

      expect(sku).toHaveProperty('id');
      expect(sku.code).toBe(newSku.code);
      expect(sku.title).toBe(newSku.title);
      expect(sku.shop_id).toBe(shopId);
      expect(sku.tenant_id).toBe(tenantId);

      skuId = sku.id;
    });

    it('getSkus - should return SKUs for shop and tenant', async () => {
      const skus = await client.getSkus({
        shop_id: shopId,
        tenant_id: tenantId,
      });

      expect(Array.isArray(skus)).toBe(true);
      expect(skus.length).toBeGreaterThan(0);
      expect(skus.some((s) => s.id === skuId)).toBe(true);
    });

    it('getSku - should return SKU by id', async () => {
      const sku = await client.getSku(skuId, {
        shop_id: shopId,
        tenant_id: tenantId,
      });

      expect(sku.id).toBe(skuId);
      expect(sku.shop_id).toBe(shopId);
      expect(sku.tenant_id).toBe(tenantId);
    });

    it('updateSku - should update SKU', async () => {
      const sku = await client.updateSku(
        skuId,
        { title: 'Updated SKU Title' },
        { shop_id: shopId, tenant_id: tenantId },
      );

      expect(sku.title).toBe('Updated SKU Title');
      expect(sku.id).toBe(skuId);
    });

    it('deleteSku - should delete SKU', async () => {
      // First verify SKU exists
      const beforeDelete = await client.getSku(skuId, { shop_id: shopId, tenant_id: tenantId });
      expect(beforeDelete.id).toBe(skuId);
      
      // Delete the SKU
      await client.deleteSku(skuId, {
        shop_id: shopId,
        tenant_id: tenantId,
      });

      skuId = 0; // Mark as deleted
    });

    it('getSku - should return 404 for deleted SKU', async () => {
      // Create a new SKU to delete
      const tempSku = await client.createSku(
        { code: `TEMP-DELETE-${Date.now()}`, title: 'Temp SKU' },
        { shop_id: shopId, tenant_id: tenantId }
      );
      
      // Delete it
      await client.deleteSku(tempSku.id, { shop_id: shopId, tenant_id: tenantId });
      
      // Verify it's gone
      try {
        await client.getSku(tempSku.id, { shop_id: shopId, tenant_id: tenantId });
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }
    });
  });

  describe('Tenant-based access control', () => {
    it('should throw 403 for accessing wrong tenant', async () => {
      const otherUser = await createUserWithApiKey(
        app,
        `other-client-${Date.now()}@example.com`,
        'Other Client User',
      );
      const otherTenant = await createTenantWithOwner(
        app,
        `Other Client Tenant ${Date.now()}`,
        otherUser.userId,
      );
      const otherShop = await createShop(app, `Other Client Shop ${Date.now()}`, otherTenant.tenantId);

      // Try to access other tenant's shop - should throw 403
      await expect(
        client.getSkus({ shop_id: otherShop.shopId, tenant_id: otherTenant.tenantId }),
      ).rejects.toThrow(ApiError);

      try {
        await client.getSkus({ shop_id: otherShop.shopId, tenant_id: otherTenant.tenantId });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }

      await cleanupUser(app, otherUser.userId);
    });
  });

  describe('Import/Export operations', () => {
    it('importSkusJson - should import SKUs from JSON', async () => {
      const code1 = `IMPORT-JSON-1-${Date.now()}`;
      const code2 = `IMPORT-JSON-2-${Date.now()}`;
      const items = [
        { code: code1, title: 'Import JSON SKU 1' },
        { code: code2, title: 'Import JSON SKU 2' },
      ];

      const result = await client.importSkusJson(items, {
        shop_id: shopId,
        tenant_id: tenantId,
      });

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      // Verify SKUs were created
      const skus = await client.getSkus({ shop_id: shopId, tenant_id: tenantId });
      const codes = skus.map((s) => s.code);
      expect(codes).toContain(code1);
      expect(codes).toContain(code2);
    });

    it('importSkusJson - should update existing SKUs (upsert)', async () => {
      const code = `UPSERT-${Date.now()}`;

      // Create initial SKU
      await client.createSku(
        { code, title: 'Original Title' },
        { shop_id: shopId, tenant_id: tenantId },
      );

      // Import with same code but different title
      const result = await client.importSkusJson(
        [{ code, title: 'Updated via Import' }],
        { shop_id: shopId, tenant_id: tenantId },
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);

      // Verify title was updated
      const skus = await client.getSkus({ shop_id: shopId, tenant_id: tenantId });
      const updatedSku = skus.find((s) => s.code === code);
      expect(updatedSku?.title).toBe('Updated via Import');
    });

    it('exportSkusJson - should export SKUs as JSON', async () => {
      const exportedSkus = await client.exportSkusJson({
        shop_id: shopId,
        tenant_id: tenantId,
      });

      expect(Array.isArray(exportedSkus)).toBe(true);
      expect(exportedSkus.length).toBeGreaterThan(0);
      expect(exportedSkus[0]).toHaveProperty('code');
      expect(exportedSkus[0]).toHaveProperty('title');
    });

    it('importSkusCsv - should import SKUs from CSV', async () => {
      const code1 = `CSV-1-${Date.now()}`;
      const code2 = `CSV-2-${Date.now()}`;
      const csv = `code,title\n${code1},"CSV SKU 1"\n${code2},"CSV SKU 2"`;

      const result = await client.importSkusCsv(csv, {
        shop_id: shopId,
        tenant_id: tenantId,
      });

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      // Verify SKUs were created
      const skus = await client.getSkus({ shop_id: shopId, tenant_id: tenantId });
      const codes = skus.map((s) => s.code);
      expect(codes).toContain(code1);
      expect(codes).toContain(code2);
    });

    it('exportSkusCsv - should export SKUs as CSV', async () => {
      const csv = await client.exportSkusCsv({
        shop_id: shopId,
        tenant_id: tenantId,
      });

      expect(typeof csv).toBe('string');
      expect(csv).toContain('code');
      expect(csv).toContain('title');
      // Should have header + at least one data row
      expect(csv.split('\n').length).toBeGreaterThan(1);
    });
  });

  describe('Example endpoints', () => {
    it('getSkusExampleJson - should return example JSON', async () => {
      const example = await client.getSkusExampleJson();

      expect(Array.isArray(example)).toBe(true);
      expect(example.length).toBeGreaterThan(0);
      expect(example[0]).toHaveProperty('code');
      expect(example[0]).toHaveProperty('title');
    });

    it('getSkusExampleCsv - should return example CSV', async () => {
      const csv = await client.getSkusExampleCsv();

      expect(typeof csv).toBe('string');
      expect(csv).toContain('code');
      expect(csv).toContain('title');
    });
  });
});
