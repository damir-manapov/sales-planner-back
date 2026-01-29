import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('Sales History (e2e)', () => {
  let app: INestApplication;
  let tenantId: number;
  let shopId: number;
  let skuId: number;
  let salesHistoryId: number;
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
      .send({ email: `sales-test-${Date.now()}@example.com`, name: 'Sales Test User' });
    testUserId = userRes.body.id;

    // Create API key for test user (random suffix prevents collision in parallel tests)
    testUserApiKey = `test-key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await request(app.getHttpServer())
      .post('/api-keys')
      .send({ user_id: testUserId, key: testUserApiKey, name: 'Test Key' });

    // Get or create an editor role
    const rolesRes = await request(app.getHttpServer()).get('/roles');
    let editorRoleId = rolesRes.body.find((r: { name: string }) => r.name === 'editor')?.id;
    if (!editorRoleId) {
      const roleRes = await request(app.getHttpServer())
        .post('/roles')
        .send({ name: 'editor', description: 'Editor user' });
      editorRoleId = roleRes.body.id;
    }

    // Assign user to shop with editor role
    await request(app.getHttpServer())
      .post('/user-roles')
      .send({ user_id: testUserId, role_id: editorRoleId, tenant_id: tenantId, shop_id: shopId });

    // Create a test SKU
    const skuRes = await request(app.getHttpServer())
      .post(`/skus?shop_id=${shopId}&tenant_id=${tenantId}`)
      .set('X-API-Key', testUserApiKey)
      .send({ code: `SKU-SALES-${Date.now()}`, title: 'Test SKU for Sales' });
    skuId = skuRes.body.id;
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
    it('GET /sales-history - should return 401 without API key', async () => {
      const response = await request(app.getHttpServer()).get(
        `/sales-history?shop_id=${shopId}&tenant_id=${tenantId}`,
      );
      expect(response.status).toBe(401);
    });
  });

  describe('CRUD operations', () => {
    it('POST /sales-history - should create sales history record', async () => {
      const newRecord = {
        sku_id: skuId,
        period: '2026-01',
        quantity: 100,
        amount: '1500.50',
      };

      const response = await request(app.getHttpServer())
        .post(`/sales-history?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send(newRecord);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.sku_id).toBe(skuId);
      expect(response.body.period).toBe('2026-01');
      expect(response.body.quantity).toBe(100);
      expect(response.body.shop_id).toBe(shopId);
      expect(response.body.tenant_id).toBe(tenantId);

      salesHistoryId = response.body.id;
    });

    it('POST /sales-history - should reject invalid period format', async () => {
      const response = await request(app.getHttpServer())
        .post(`/sales-history?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send({
          sku_id: skuId,
          period: '2026-13', // invalid month
          quantity: 50,
          amount: '500.00',
        });

      expect(response.status).toBe(400);
    });

    it('POST /sales-history - should reject invalid period string', async () => {
      const response = await request(app.getHttpServer())
        .post(`/sales-history?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send({
          sku_id: skuId,
          period: '2026-1', // missing leading zero
          quantity: 50,
          amount: '500.00',
        });

      expect(response.status).toBe(400);
    });

    it('GET /sales-history - should return sales history for shop', async () => {
      const response = await request(app.getHttpServer())
        .get(`/sales-history?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('GET /sales-history - should filter by period range', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/sales-history?shop_id=${shopId}&tenant_id=${tenantId}&period_from=2026-01&period_to=2026-12`,
        )
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((r: { period: string }) => {
        expect(r.period >= '2026-01' && r.period <= '2026-12').toBe(true);
      });
    });

    it('GET /sales-history/:id - should return record by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/sales-history/${salesHistoryId}?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(salesHistoryId);
    });

    it('PUT /sales-history/:id - should update record', async () => {
      const response = await request(app.getHttpServer())
        .put(`/sales-history/${salesHistoryId}?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send({ quantity: 150, amount: '2000.00' });

      expect(response.status).toBe(200);
      expect(response.body.quantity).toBe(150);
      expect(response.body.amount).toBe('2000.00');
    });

    it('DELETE /sales-history/:id - should delete record', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/sales-history/${salesHistoryId}?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      salesHistoryId = 0;
    });
  });

  describe('Bulk import', () => {
    it('POST /sales-history/import - should import multiple records', async () => {
      const items = [
        { sku_id: skuId, period: '2025-11', quantity: 80, amount: '1200.00' },
        { sku_id: skuId, period: '2025-12', quantity: 90, amount: '1350.00' },
      ];

      const response = await request(app.getHttpServer())
        .post(`/sales-history/import?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send(items);

      expect(response.status).toBe(201);
      expect(response.body.created).toBe(2);
      expect(response.body.updated).toBe(0);
      expect(response.body.errors).toEqual([]);
    });

    it('POST /sales-history/import - should upsert existing records', async () => {
      const items = [{ sku_id: skuId, period: '2025-11', quantity: 100, amount: '1500.00' }];

      const response = await request(app.getHttpServer())
        .post(`/sales-history/import?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send(items);

      expect(response.status).toBe(201);
      expect(response.body.created).toBe(0);
      expect(response.body.updated).toBe(1);
    });
  });
});
