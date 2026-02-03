import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import {
  cleanupUser,
  createShop,
  createTenantWithOwner,
  createUserWithApiKey,
  getOrCreateRole,
  assignRole,
  SYSTEM_ADMIN_KEY,
} from './test-helpers.js';

describe('Shops E2E', () => {
  let app: INestApplication;

  // Test data
  let testUserId: number;
  let testUserApiKey: string;
  let testTenantId: number;
  let testShopId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user and tenant
    const user = await createUserWithApiKey(
      app,
      `shops-test-${Date.now()}@example.com`,
      'Shops Test User',
    );
    testUserId = user.userId;
    testUserApiKey = user.apiKey;

    const tenant = await createTenantWithOwner(app, `Shops Test Tenant ${Date.now()}`, testUserId);
    testTenantId = tenant.tenantId;
  });

  afterAll(async () => {
    if (testUserId) {
      await cleanupUser(app, testUserId);
    }
    await app.close();
  });

  describe('Shop CRUD', () => {
    it('POST /shops - tenant owner should create shop', async () => {
      const response = await request(app.getHttpServer())
        .post('/shops')
        .set('X-API-Key', testUserApiKey)
        .send({ title: 'Test Shop', tenant_id: testTenantId });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Test Shop');
      expect(response.body.tenant_id).toBe(testTenantId);
      testShopId = response.body.id;
    });

    it('GET /shops - tenant owner should list shops', async () => {
      const response = await request(app.getHttpServer())
        .get('/shops')
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((s: { id: number }) => s.id === testShopId)).toBe(true);
    });

    it('GET /shops?tenantId=X - should filter by tenant', async () => {
      const response = await request(app.getHttpServer())
        .get(`/shops?tenantId=${testTenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(response.body.every((s: { tenant_id: number }) => s.tenant_id === testTenantId)).toBe(
        true,
      );
    });

    it('GET /shops/:id - should return shop by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/shops/${testShopId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testShopId);
      expect(response.body.title).toBe('Test Shop');
    });

    it('PUT /shops/:id - tenant owner should update shop', async () => {
      const response = await request(app.getHttpServer())
        .put(`/shops/${testShopId}`)
        .set('X-API-Key', testUserApiKey)
        .send({ title: 'Updated Shop' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Shop');
    });

    it('GET /shops/:id - should return 404 for non-existent shop', async () => {
      const response = await request(app.getHttpServer())
        .get('/shops/999999')
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(404);
    });
  });

  describe('Tenant Admin access', () => {
    let tenantAdminUserId: number;
    let tenantAdminApiKey: string;
    let adminCreatedShopId: number;

    beforeAll(async () => {
      // Create tenant admin user
      const adminUser = await createUserWithApiKey(
        app,
        `tenant-admin-${Date.now()}@example.com`,
        'Tenant Admin User',
      );
      tenantAdminUserId = adminUser.userId;
      tenantAdminApiKey = adminUser.apiKey;

      // Assign tenantAdmin role
      const tenantAdminRoleId = await getOrCreateRole(app, 'tenantAdmin', 'Tenant Administrator');
      await assignRole(app, tenantAdminUserId, tenantAdminRoleId, { tenantId: testTenantId });
    });

    afterAll(async () => {
      if (tenantAdminUserId) {
        await cleanupUser(app, tenantAdminUserId);
      }
    });

    it('GET /shops - tenant admin should list shops in their tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/shops')
        .set('X-API-Key', tenantAdminApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /shops - tenant admin should create shop', async () => {
      const response = await request(app.getHttpServer())
        .post('/shops')
        .set('X-API-Key', tenantAdminApiKey)
        .send({ title: 'Admin Created Shop', tenant_id: testTenantId });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Admin Created Shop');
      adminCreatedShopId = response.body.id;
    });

    it('PUT /shops/:id - tenant admin should update shop', async () => {
      const response = await request(app.getHttpServer())
        .put(`/shops/${adminCreatedShopId}`)
        .set('X-API-Key', tenantAdminApiKey)
        .send({ title: 'Admin Updated Shop' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Admin Updated Shop');
    });

    it('DELETE /shops/:id - tenant admin should delete shop', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/shops/${adminCreatedShopId}`)
        .set('X-API-Key', tenantAdminApiKey);

      expect(response.status).toBe(200);
    });
  });

  describe('Cross-tenant access control', () => {
    let otherUserId: number;
    let otherUserApiKey: string;

    beforeAll(async () => {
      // Create another user with their own tenant
      const otherUser = await createUserWithApiKey(
        app,
        `other-user-${Date.now()}@example.com`,
        'Other User',
      );
      otherUserId = otherUser.userId;
      otherUserApiKey = otherUser.apiKey;

      await createTenantWithOwner(app, `Other Tenant ${Date.now()}`, otherUserId);
    });

    afterAll(async () => {
      if (otherUserId) {
        await cleanupUser(app, otherUserId);
      }
    });

    it('GET /shops/:id - should return 403 for shop in other tenant', async () => {
      const response = await request(app.getHttpServer())
        .get(`/shops/${testShopId}`)
        .set('X-API-Key', otherUserApiKey);

      expect(response.status).toBe(403);
    });

    it('GET /shops?tenantId=X - should return 403 for other tenant', async () => {
      const response = await request(app.getHttpServer())
        .get(`/shops?tenantId=${testTenantId}`)
        .set('X-API-Key', otherUserApiKey);

      expect(response.status).toBe(403);
    });

    it('POST /shops - should return 403 when creating shop in other tenant', async () => {
      const response = await request(app.getHttpServer())
        .post('/shops')
        .set('X-API-Key', otherUserApiKey)
        .send({ title: 'Unauthorized Shop', tenant_id: testTenantId });

      expect(response.status).toBe(403);
    });

    it('PUT /shops/:id - should return 403 when updating shop in other tenant', async () => {
      const response = await request(app.getHttpServer())
        .put(`/shops/${testShopId}`)
        .set('X-API-Key', otherUserApiKey)
        .send({ title: 'Hacked Shop' });

      expect(response.status).toBe(403);
    });

    it('DELETE /shops/:id - should return 403 when deleting shop in other tenant', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/shops/${testShopId}`)
        .set('X-API-Key', otherUserApiKey);

      expect(response.status).toBe(403);
    });
  });

  describe('Delete shop data', () => {
    let dataShopId: number;

    beforeAll(async () => {
      // Create a shop with data
      const shop = await createShop(app, `Data Shop ${Date.now()}`, testTenantId);
      dataShopId = shop.shopId;

      // Import some SKUs
      await request(app.getHttpServer())
        .post(`/skus/import/json?shop_id=${dataShopId}&tenant_id=${testTenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send([
          { code: 'DATA-SKU-1', title: 'Test SKU 1' },
          { code: 'DATA-SKU-2', title: 'Test SKU 2' },
        ]);

      // Import sales history
      await request(app.getHttpServer())
        .post(`/sales-history/import/json?shop_id=${dataShopId}&tenant_id=${testTenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send([
          { sku_code: 'DATA-SKU-1', period: '2025-01', quantity: 100 },
          { sku_code: 'DATA-SKU-2', period: '2025-01', quantity: 200 },
        ]);
    });

    it('DELETE /shops/:id/data - should delete shop data', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/shops/${dataShopId}/data`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(response.body.skusDeleted).toBe(2);
      expect(response.body.salesHistoryDeleted).toBe(2);
    });

    it('GET /skus - should return empty after data deletion', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skus?shop_id=${dataShopId}&tenant_id=${testTenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('System admin access', () => {
    it('GET /shops - system admin should see all shops', async () => {
      const response = await request(app.getHttpServer())
        .get('/shops')
        .set('X-API-Key', SYSTEM_ADMIN_KEY);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /shops/:id - system admin should access any shop', async () => {
      const response = await request(app.getHttpServer())
        .get(`/shops/${testShopId}`)
        .set('X-API-Key', SYSTEM_ADMIN_KEY);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testShopId);
    });
  });

  describe('Shop deletion', () => {
    it('DELETE /shops/:id - tenant owner should delete shop', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/shops/${testShopId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
    });

    it('GET /shops/:id - should return 404 after deletion', async () => {
      const response = await request(app.getHttpServer())
        .get(`/shops/${testShopId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(404);
    });
  });
});
