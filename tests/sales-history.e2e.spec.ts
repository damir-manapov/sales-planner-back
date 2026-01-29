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
  let skuCode: string;
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
    skuCode = `SKU-SALES-${Date.now()}`;
    const skuRes = await request(app.getHttpServer())
      .post(`/skus?shop_id=${shopId}&tenant_id=${tenantId}`)
      .set('X-API-Key', testUserApiKey)
      .send({ code: skuCode, title: 'Test SKU for Sales' });
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
        .send({ quantity: 150 });

      expect(response.status).toBe(200);
      expect(response.body.quantity).toBe(150);
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
        { sku_code: skuCode, period: '2025-11', quantity: 80 },
        { sku_code: skuCode, period: '2025-12', quantity: 90 },
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
      const items = [{ sku_code: skuCode, period: '2025-11', quantity: 100 }];

      const response = await request(app.getHttpServer())
        .post(`/sales-history/import?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send(items);

      expect(response.status).toBe(201);
      expect(response.body.created).toBe(0);
      expect(response.body.updated).toBe(1);
    });

    it('POST /sales-history/import - should auto-create missing SKUs', async () => {
      const newSkuCode = `AUTO-SKU-${Date.now()}`;
      const items = [{ sku_code: newSkuCode, period: '2025-05', quantity: 50 }];

      const response = await request(app.getHttpServer())
        .post(`/sales-history/import?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send(items);

      expect(response.status).toBe(201);
      expect(response.body.created).toBe(1);
      expect(response.body.skus_created).toBe(1);
      expect(response.body.errors).toEqual([]);

      // Verify SKU was actually created
      const skusResponse = await request(app.getHttpServer())
        .get(`/skus?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);

      const createdSku = skusResponse.body.find((s: { code: string }) => s.code === newSkuCode);
      expect(createdSku).toBeDefined();
      expect(createdSku.title).toBe(newSkuCode); // Title defaults to code
    });

    it('GET /sales-history/export/json - should export sales history in import format', async () => {
      // Create SKU and sales history data
      const exportSkuCode = `EXPORT-SH-${Date.now()}`;
      await request(app.getHttpServer())
        .post(`/skus/import/json?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send([{ code: exportSkuCode, title: 'Export Test SKU' }]);

      // Import sales history
      await request(app.getHttpServer())
        .post(`/sales-history/import?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send([{ sku_code: exportSkuCode, period: '2025-07', quantity: 100 }]);

      // Export
      const response = await request(app.getHttpServer())
        .get(`/sales-history/export/json?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const exported = response.body as Array<{
        sku_code: string;
        period: string;
        quantity: number;
      }>;
      const item = exported.find((r) => r.sku_code === exportSkuCode && r.period === '2025-07');
      expect(item).toBeDefined();
      expect(item).toEqual({
        sku_code: exportSkuCode,
        period: '2025-07',
        quantity: 100,
      });
    });

    it('GET /sales-history/export/json - should filter by period', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/sales-history/export/json?shop_id=${shopId}&tenant_id=${tenantId}&period_from=2025-07&period_to=2025-07`,
        )
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // All returned items should have period 2025-07
      const periods = (response.body as Array<{ period: string }>).map((r) => r.period);
      expect(periods.every((p) => p === '2025-07')).toBe(true);
    });

    it('GET /sales-history/export/csv - should export sales history in CSV format', async () => {
      const response = await request(app.getHttpServer())
        .get(`/sales-history/export/csv?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(typeof response.body.content).toBe('string');

      const lines = response.body.content.split('\n');
      expect(lines[0]).toBe('sku_code,period,quantity');
      expect(lines.length).toBeGreaterThan(1);
    });

    it('POST /sales-history/import/csv - should import sales history from CSV', async () => {
      const skuCode = `CSV-IMPORT-${Date.now()}`;
      const csvContent = `sku_code,period,quantity\n${skuCode},2025-08,75`;

      const response = await request(app.getHttpServer())
        .post(`/sales-history/import/csv?shop_id=${shopId}&tenant_id=${tenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send({ content: csvContent });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('created');
      expect(response.body.created).toBeGreaterThanOrEqual(1);
      expect(response.body).toHaveProperty('skus_created');

      // Verify the data was imported using the export endpoint which includes sku_code
      const exportResponse = await request(app.getHttpServer())
        .get(`/sales-history/export/json?shop_id=${shopId}&tenant_id=${tenantId}&period_from=2025-08&period_to=2025-08`)
        .set('X-API-Key', testUserApiKey);

      const imported = (exportResponse.body as Array<{ sku_code: string; period: string; quantity: number }>).find(
        (r) => r.sku_code === skuCode && r.period === '2025-08',
      );
      expect(imported).toBeDefined();
      expect(imported?.quantity).toBe(75);
    });
  });
});
