import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

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

    // Create test tenant
    const tenantRes = await request(app.getHttpServer())
      .post('/tenants')
      .send({ title: `Test Tenant ${Date.now()}` });
    tenantId = tenantRes.body.id;

    // Create test shop
    const shopRes = await request(app.getHttpServer())
      .post('/shops')
      .send({ title: `Test Shop ${Date.now()}`, tenant_id: tenantId });
    shopId = shopRes.body.id;

    // Create test user
    const userRes = await request(app.getHttpServer())
      .post('/users')
      .send({ email: `sku-test-${Date.now()}@example.com`, name: 'SKU Test User' });
    testUserId = userRes.body.id;

    // Create API key for test user (random suffix prevents collision in parallel tests)
    testUserApiKey = `test-key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await request(app.getHttpServer())
      .post('/api-keys')
      .send({ user_id: testUserId, key: testUserApiKey, name: 'Test Key' });

    // Get or create an editor role for the user (needed for read and write operations)
    const rolesRes = await request(app.getHttpServer()).get('/roles');
    let editorRoleId = rolesRes.body.find((r: { name: string }) => r.name === 'editor')?.id;
    if (!editorRoleId) {
      const roleRes = await request(app.getHttpServer())
        .post('/roles')
        .send({ name: 'editor', description: 'Editor user' });
      editorRoleId = roleRes.body.id;
    }

    // Assign user to shop via user_roles with editor role (shop-level role)
    await request(app.getHttpServer())
      .post('/user-roles')
      .send({ user_id: testUserId, role_id: editorRoleId, tenant_id: tenantId, shop_id: shopId });
  });

  afterAll(async () => {
    // Cleanup
    if (skuId) {
      await request(app.getHttpServer())
        .delete(`/skus/${skuId}?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);
    }
    if (shopId) {
      await request(app.getHttpServer()).delete(`/shops/${shopId}`);
    }
    if (tenantId) {
      await request(app.getHttpServer()).delete(`/tenants/${tenantId}`);
    }
    if (testUserId) {
      await request(app.getHttpServer()).delete(`/users/${testUserId}`);
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
      // Create another tenant
      const otherTenantRes = await request(app.getHttpServer())
        .post('/tenants')
        .send({ title: `Other Tenant ${Date.now()}` });
      const otherTenantId = otherTenantRes.body.id;

      // Create shop in other tenant
      const otherShopRes = await request(app.getHttpServer())
        .post('/shops')
        .send({ title: `Other Shop ${Date.now()}`, tenant_id: otherTenantId });
      const otherShopId = otherShopRes.body.id;

      // Try to access other tenant's shop - should be forbidden
      const response = await request(app.getHttpServer())
        .get(`/skus?shop_id=${otherShopId}&tenant_id=${otherTenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(403);

      // Cleanup
      await request(app.getHttpServer()).delete(`/shops/${otherShopId}`);
      await request(app.getHttpServer()).delete(`/tenants/${otherTenantId}`);
    });

    it('POST /skus - should return 403 when creating SKU for wrong tenant', async () => {
      // Create another tenant
      const otherTenantRes = await request(app.getHttpServer())
        .post('/tenants')
        .send({ title: `Other Tenant ${Date.now()}` });
      const otherTenantId = otherTenantRes.body.id;

      const response = await request(app.getHttpServer())
        .post(`/skus?shop_id=${shopId}&tenant_id=${otherTenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send({
          code: 'FORBIDDEN-SKU',
          title: 'Should Fail',
        });

      expect(response.status).toBe(403);

      // Cleanup
      await request(app.getHttpServer()).delete(`/tenants/${otherTenantId}`);
    });

    it('GET /skus/:id - should return 404 for SKU in wrong tenant', async () => {
      // Create another tenant
      const otherTenantRes = await request(app.getHttpServer())
        .post('/tenants')
        .send({ title: `Other Tenant ${Date.now()}` });
      const otherTenantId = otherTenantRes.body.id;

      // Create a shop in the other tenant
      const otherShopRes = await request(app.getHttpServer())
        .post('/shops')
        .send({ title: `Other Shop ${Date.now()}`, tenant_id: otherTenantId });
      const otherShopId = otherShopRes.body.id;

      // Give user tenantAdmin role for other tenant (tenant-level role)
      const rolesRes = await request(app.getHttpServer()).get('/roles');
      let tenantAdminRoleId = rolesRes.body.find(
        (r: { name: string }) => r.name === 'tenantAdmin',
      )?.id;
      if (!tenantAdminRoleId) {
        const roleRes = await request(app.getHttpServer())
          .post('/roles')
          .send({ name: 'tenantAdmin', description: 'Tenant Admin' });
        tenantAdminRoleId = roleRes.body.id;
      }
      await request(app.getHttpServer())
        .post('/user-roles')
        .send({ user_id: testUserId, role_id: tenantAdminRoleId, tenant_id: otherTenantId });

      // Try to access original SKU with other tenant/shop - should return 404 (SKU not in that shop/tenant)
      const response = await request(app.getHttpServer())
        .get(`/skus/${skuId}?shop_id=${otherShopId}&tenant_id=${otherTenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(404);

      // Cleanup
      await request(app.getHttpServer()).delete(`/shops/${otherShopId}`);
      await request(app.getHttpServer()).delete(`/tenants/${otherTenantId}`);
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
        .send({ content: csvContent });

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
  });

  describe('Viewer role access', () => {
    let viewerUserId: number;
    let viewerApiKey: string;

    beforeAll(async () => {
      // Create a viewer user
      const userRes = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `viewer-${Date.now()}@example.com`, name: 'Viewer User' });
      viewerUserId = userRes.body.id;

      // Create API key for viewer user
      viewerApiKey = `viewer-key-${Date.now()}`;
      await request(app.getHttpServer())
        .post('/api-keys')
        .send({ user_id: viewerUserId, key: viewerApiKey, name: 'Viewer Key' });

      // Get or create viewer role
      const rolesRes = await request(app.getHttpServer()).get('/roles');
      let viewerRoleId = rolesRes.body.find((r: { name: string }) => r.name === 'viewer')?.id;
      if (!viewerRoleId) {
        const roleRes = await request(app.getHttpServer())
          .post('/roles')
          .send({ name: 'viewer', description: 'Viewer user' });
        viewerRoleId = roleRes.body.id;
      }

      // Assign viewer role for the shop
      await request(app.getHttpServer()).post('/user-roles').send({
        user_id: viewerUserId,
        role_id: viewerRoleId,
        tenant_id: tenantId,
        shop_id: shopId,
      });
    });

    afterAll(async () => {
      if (viewerUserId) {
        await request(app.getHttpServer()).delete(`/users/${viewerUserId}`);
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
      // Create tenant owner user
      const userRes = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `owner-${Date.now()}@example.com`, name: 'Tenant Owner User' });
      ownerUserId = userRes.body.id;

      // Create API key for owner
      ownerApiKey = `owner-key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await request(app.getHttpServer())
        .post('/api-keys')
        .send({ user_id: ownerUserId, key: ownerApiKey, name: 'Owner Key' });

      // Create a tenant with this user as owner
      const tenantRes = await request(app.getHttpServer())
        .post('/tenants')
        .send({ title: `Owner Tenant ${Date.now()}`, owner_id: ownerUserId });
      ownerTenantId = tenantRes.body.id;

      // Create a shop in the owned tenant
      const shopRes = await request(app.getHttpServer())
        .post('/shops')
        .send({ title: `Owner Shop ${Date.now()}`, tenant_id: ownerTenantId });
      ownerShopId = shopRes.body.id;

      // Note: NO explicit role assignment - owner access is derived from tenants.owner_id
    });

    afterAll(async () => {
      if (ownerShopId) {
        await request(app.getHttpServer()).delete(`/shops/${ownerShopId}`);
      }
      if (ownerTenantId) {
        await request(app.getHttpServer()).delete(`/tenants/${ownerTenantId}`);
      }
      if (ownerUserId) {
        await request(app.getHttpServer()).delete(`/users/${ownerUserId}`);
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

      expect(response.status).toBe(403);
    });
  });
});
