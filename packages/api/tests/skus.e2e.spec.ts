import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
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
  let tenantId: number;
  let shopId: number;
  let skuId: number;
  let testUserId: number;
  let testUserApiKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create tenant with shop and user in one call
    const setupRes = await request(app.getHttpServer())
      .post('/tenants/with-shop-and-user')
      .set('X-API-Key', SYSTEM_ADMIN_KEY)
      .send({
        tenantTitle: `Test Tenant ${Date.now()}`,
        userEmail: `sku-test-${Date.now()}@example.com`,
        userName: 'SKU Test User',
      });

    testUserId = setupRes.body.user.id;
    testUserApiKey = setupRes.body.apiKey;
    tenantId = setupRes.body.tenant.id;
    shopId = setupRes.body.shop.id;
  });

  afterAll(async () => {
    // Cleanup using helper that handles foreign key constraints
    if (testUserId) {
      await cleanupUser(app, testUserId);
    }
    await app.close();
  });

  describe('Authentication', () => {
    it('GET /skus - should return 401 without API key', async () => {
      const response = await request(app.getHttpServer()).get(
        `/skus?shop_id=${shopId}&tenant_id=${tenantId}`,
      );
      expect(response.status).toBe(401);
    });

    it('GET /skus - should return 401 with invalid API key', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skus?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', 'invalid-key');
      expect(response.status).toBe(401);
    });
  });

  describe('CRUD operations', () => {
    it('POST /skus - should create SKU', async () => {
      const newSku = {
        code: `SKU-${Date.now()}`,
        title: 'Test SKU',
      };

      const response = await request(app.getHttpServer())
        .post(`/skus?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send(newSku);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.code).toBe(newSku.code);
      expect(response.body.title).toBe(newSku.title);
      expect(response.body.shop_id).toBe(shopId);
      expect(response.body.tenant_id).toBe(tenantId);

      skuId = response.body.id;
    });

    it('GET /skus - should return SKUs for shop and tenant', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skus?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('GET /skus - should require shop_id and tenant_id', async () => {
      const response = await request(app.getHttpServer())
        .get('/skus')
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(400);
    });

    it('GET /skus/:id - should return SKU by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skus/${skuId}?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(skuId);
    });

    it('GET /skus/:id - should require shop_id and tenant_id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skus/${skuId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(400);
    });

    it('PUT /skus/:id - should update SKU', async () => {
      const response = await request(app.getHttpServer())
        .put(`/skus/${skuId}?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send({ title: 'Updated SKU Title' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated SKU Title');
    });

    it('PUT /skus/:id - should require shop_id and tenant_id', async () => {
      const response = await request(app.getHttpServer())
        .put(`/skus/${skuId}`)
        .set('X-API-Key', testUserApiKey)
        .send({ title: 'Should Fail' });

      expect(response.status).toBe(400);
    });
  });

  describe('Tenant-based access control', () => {
    it('GET /skus - should return 403 for wrong tenant', async () => {
      // Create another user with tenant and shop using helpers
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

      // Try to access other tenant's shop - should be forbidden
      const response = await request(app.getHttpServer())
        .get(`/skus?shop_id=${otherShop.shopId}&tenant_id=${otherTenant.tenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(403); // User has no access to other tenant

      // Cleanup
      await cleanupUser(app, otherUser.userId);
    });

    it('POST /skus - should return 403 when creating SKU for wrong tenant', async () => {
      // Create another user with tenant using helpers
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

      const response = await request(app.getHttpServer())
        .post(`/skus?shop_id=${shopId}&tenant_id=${otherTenant.tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send({
          code: 'FORBIDDEN-SKU',
          title: 'Should Fail',
        });

      expect(response.status).toBe(403); // User has no access to other tenant

      // Cleanup
      await cleanupUser(app, otherUser.userId);
    });

    it('GET /skus/:id - should return 404 for SKU in wrong tenant', async () => {
      // Create another user with tenant and shop using helpers
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

      // Give user tenantAdmin role for other tenant
      const tenantAdminRoleId = await getOrCreateRole(app, 'tenantAdmin', 'Tenant Admin');
      await assignRole(app, testUserId, tenantAdminRoleId, { tenantId: otherTenant.tenantId });

      // Try to access original SKU with other tenant/shop - should return 404
      const response = await request(app.getHttpServer())
        .get(`/skus/${skuId}?shop_id=${otherShop.shopId}&tenant_id=${otherTenant.tenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(404); // SKU not found in other tenant

      // Cleanup
      await cleanupUser(app, otherUser.userId);
    });
  });

  describe('Cleanup', () => {
    it('DELETE /skus/:id - should delete SKU', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/skus/${skuId}?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      skuId = 0; // Mark as deleted for afterAll

      // Verify deleted
      const getResponse = await request(app.getHttpServer())
        .get(`/skus/${skuId}?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);
      expect(getResponse.status).toBe(404);
    });

    it('DELETE /skus/:id - should require shop_id and tenant_id', async () => {
      // Create a new SKU to test delete validation
      const newSku = {
        code: `SKU-DELETE-${Date.now()}`,
        title: 'Delete Test SKU',
      };

      const createRes = await request(app.getHttpServer())
        .post(`/skus?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send(newSku);

      const testSkuId = createRes.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/skus/${testSkuId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(400);

      // Cleanup the created SKU
      await request(app.getHttpServer())
        .delete(`/skus/${testSkuId}?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);
    });
  });

  describe('Import endpoints', () => {
    it('POST /skus/import/json - should import SKUs from JSON', async () => {
      const code1 = `IMPORT-JSON-1-${Date.now()}`;
      const code2 = `IMPORT-JSON-2-${Date.now()}`;
      const items = [
        { code: code1, title: 'Import JSON SKU 1' },
        { code: code2, title: 'Import JSON SKU 2' },
      ];

      const response = await request(app.getHttpServer())
        .post(`/skus/import/json?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send(items);

      expect(response.status).toBe(201);
      expect(response.body.created).toBe(2);
      expect(response.body.updated).toBe(0);
      expect(response.body.errors).toEqual([]);

      // Verify SKUs were created
      const listResponse = await request(app.getHttpServer())
        .get(`/skus?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);

      const codes = listResponse.body.map((s: { code: string }) => s.code);
      expect(codes).toContain(code1);
      expect(codes).toContain(code2);
    });

    it('POST /skus/import/json - should upsert existing SKUs', async () => {
      const code = `UPSERT-JSON-${Date.now()}`;

      // First import
      await request(app.getHttpServer())
        .post(`/skus/import/json?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send([{ code, title: 'Original Title' }]);

      // Second import with same code (upsert)
      const response = await request(app.getHttpServer())
        .post(`/skus/import/json?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send([{ code, title: 'Updated Title' }]);

      expect(response.status).toBe(201);
      expect(response.body.created).toBe(0);
      expect(response.body.updated).toBe(1);
    });

    it('POST /skus/import/csv - should import SKUs from CSV', async () => {
      const code1 = `IMPORT-CSV-1-${Date.now()}`;
      const code2 = `IMPORT-CSV-2-${Date.now()}`;
      const csvContent = `code,title\n${code1},Import CSV SKU 1\n${code2},Import CSV SKU 2`;

      const response = await request(app.getHttpServer())
        .post(`/skus/import/csv?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .attach('file', Buffer.from(csvContent), 'skus.csv');

      expect(response.status).toBe(201);
      expect(response.body.created).toBe(2);
      expect(response.body.updated).toBe(0);

      // Verify SKUs were created
      const listResponse = await request(app.getHttpServer())
        .get(`/skus?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);

      const codes = listResponse.body.map((s: { code: string }) => s.code);
      expect(codes).toContain(code1);
      expect(codes).toContain(code2);
    });

    it('POST /skus/import/csv - should return 400 for invalid CSV', async () => {
      const response = await request(app.getHttpServer())
        .post(`/skus/import/csv?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send({ content: 'invalid,csv\nno,code,column' });

      expect(response.status).toBe(400);
    });

    it('GET /skus/export/json - should export SKUs in import format', async () => {
      // First create some SKUs to export
      const code1 = `EXPORT-SKU-1-${Date.now()}`;
      const code2 = `EXPORT-SKU-2-${Date.now()}`;

      await request(app.getHttpServer())
        .post(`/skus/import/json?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send([
          { code: code1, title: 'Export Test SKU 1' },
          { code: code2, title: 'Export Test SKU 2' },
        ]);

      const response = await request(app.getHttpServer())
        .get(`/skus/export/json?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const exported = response.body as Array<{ code: string; title: string }>;
      const exportedCodes = exported.map((s) => s.code);
      expect(exportedCodes).toContain(code1);
      expect(exportedCodes).toContain(code2);

      // Verify format matches import format (only code and title)
      const item = exported.find((s) => s.code === code1);
      expect(item).toEqual({ code: code1, title: 'Export Test SKU 1' });
    });

    it('GET /skus/export/csv - should export SKUs in CSV format', async () => {
      // First create some SKUs to export
      const code1 = `CSV-EXPORT-SKU-1-${Date.now()}`;
      const code2 = `CSV-EXPORT-SKU-2-${Date.now()}`;

      await request(app.getHttpServer())
        .post(`/skus/import/json?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send([
          { code: code1, title: 'CSV Export Test 1' },
          { code: code2, title: 'CSV Export Test 2' },
        ]);

      const response = await request(app.getHttpServer())
        .get(`/skus/export/csv?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(response.text).toBeTruthy();
      expect(typeof response.text).toBe('string');

      const lines = response.text.split('\n');
      expect(lines[0]).toBe('code,title');
      expect(lines.some((line) => line.includes(code1))).toBe(true);
      expect(lines.some((line) => line.includes(code2))).toBe(true);
    });
  });

  describe('Viewer role access', () => {
    let viewerUserId: number;
    let viewerApiKey: string;

    beforeAll(async () => {
      // Create a viewer user using helper
      const viewer = await createUserWithApiKey(
        app,
        `viewer-${Date.now()}@example.com`,
        'Viewer User',
      );
      viewerUserId = viewer.userId;
      viewerApiKey = viewer.apiKey;

      // Get or create viewer role and assign it
      const viewerRoleId = await getOrCreateRole(app, 'viewer', 'Viewer user');
      await assignRole(app, viewerUserId, viewerRoleId, { tenantId, shopId });
    });

    afterAll(async () => {
      // Viewer user cleanup
      if (viewerUserId) {
        await cleanupUser(app, viewerUserId);
      }
    });

    it('GET /skus - viewer should be able to list SKUs', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skus?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', viewerApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /skus - viewer should not be able to create SKUs', async () => {
      const response = await request(app.getHttpServer())
        .post(`/skus?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', viewerApiKey)
        .send({ code: 'VIEWER-CREATE', title: 'Should Fail' });

      expect(response.status).toBe(403);
    });

    it('POST /skus/import/json - viewer should not be able to import', async () => {
      const response = await request(app.getHttpServer())
        .post(`/skus/import/json?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', viewerApiKey)
        .send([{ code: 'VIEWER-IMPORT', title: 'Should Fail' }]);

      expect(response.status).toBe(403);
    });
  });

  describe('Example downloads', () => {
    it('GET /skus/examples/json - should return JSON example without auth', async () => {
      const response = await request(app.getHttpServer()).get('/skus/examples/json');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('skus-example.json');
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('code');
      expect(response.body[0]).toHaveProperty('title');
    });

    it('GET /skus/examples/csv - should return CSV example without auth', async () => {
      const response = await request(app.getHttpServer()).get('/skus/examples/csv');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('skus-example.csv');
      expect(response.text).toContain('code,title');
      expect(response.text).toContain('SKU-001');
    });
  });

  describe('Tenant owner access (derived role)', () => {
    let ownerUserId: number;
    let ownerApiKey: string;
    let ownerTenantId: number;
    let ownerShopId: number;

    beforeAll(async () => {
      // Create tenant owner user using helper
      const owner = await createUserWithApiKey(
        app,
        `owner-${Date.now()}@example.com`,
        'Tenant Owner User',
      );
      ownerUserId = owner.userId;
      ownerApiKey = owner.apiKey;

      // Create a tenant with this user as owner
      const tenant = await createTenantWithOwner(app, `Owner Tenant ${Date.now()}`, ownerUserId);
      ownerTenantId = tenant.tenantId;

      // Create a shop in the owned tenant
      const shop = await createShop(app, `Owner Shop ${Date.now()}`, ownerTenantId);
      ownerShopId = shop.shopId;

      // Note: NO explicit role assignment - owner access is derived from tenants.owner_id
    });

    afterAll(async () => {
      // Cleanup using helper that handles foreign key constraints
      if (ownerUserId) {
        await cleanupUser(app, ownerUserId);
      }
    });

    it('GET /skus - tenant owner should have read access without explicit role', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skus?shop_id=${ownerShopId}&tenant_id=${ownerTenantId}`)
        .set('X-API-Key', ownerApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /skus - tenant owner should have write access without explicit role', async () => {
      const response = await request(app.getHttpServer())
        .post(`/skus?shop_id=${ownerShopId}&tenant_id=${ownerTenantId}`)
        .set('X-API-Key', ownerApiKey)
        .send({ code: 'OWNER-SKU', title: 'Owner Created SKU' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/skus/${response.body.id}?shop_id=${ownerShopId}&tenant_id=${ownerTenantId}`)
        .set('X-API-Key', ownerApiKey);
    });

    it('POST /skus/import/json - tenant owner should be able to import', async () => {
      const response = await request(app.getHttpServer())
        .post(`/skus/import/json?shop_id=${ownerShopId}&tenant_id=${ownerTenantId}`)
        .set('X-API-Key', ownerApiKey)
        .send([{ code: 'OWNER-IMPORT-1', title: 'Owner Import 1' }]);

      expect(response.status).toBe(201);
      expect(response.body.created + response.body.updated).toBe(1);
    });

    it('GET /skus - tenant owner should NOT access other tenants', async () => {
      // Try to access the main test tenant (ownerUserId is not owner of tenantId)
      const response = await request(app.getHttpServer())
        .get(`/skus?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', ownerApiKey);

      expect(response.status).toBe(403); // No access to other tenant
    });
  });
});
