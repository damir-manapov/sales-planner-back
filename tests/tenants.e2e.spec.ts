import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('Tenants (e2e)', () => {
  let app: INestApplication;
  let testUserId: number;
  let testUserApiKey: string;
  let createdTenantId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user
    const userRes = await request(app.getHttpServer())
      .post('/users')
      .send({ email: `tenant-test-${Date.now()}@example.com`, name: 'Tenant Test User' });
    testUserId = userRes.body.id;

    // Create API key for test user
    testUserApiKey = `test-key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await request(app.getHttpServer())
      .post('/api-keys')
      .send({ user_id: testUserId, key: testUserApiKey, name: 'Test Key' });
  });

  afterAll(async () => {
    // Cleanup
    if (createdTenantId) {
      await request(app.getHttpServer())
        .delete(`/tenants/${createdTenantId}`)
        .set('X-API-Key', testUserApiKey);
    }
    if (testUserId) {
      await request(app.getHttpServer()).delete(`/users/${testUserId}`);
    }
    await app.close();
  });

  describe('Authentication', () => {
    it('POST /tenants - should return 401 without API key', async () => {
      const response = await request(app.getHttpServer())
        .post('/tenants')
        .send({ title: 'Test Tenant' });
      expect(response.status).toBe(401);
    });

    it('POST /tenants - should return 401 with invalid API key', async () => {
      const response = await request(app.getHttpServer())
        .post('/tenants')
        .set('X-API-Key', 'invalid-key')
        .send({ title: 'Test Tenant' });
      expect(response.status).toBe(401);
    });

    it('GET /tenants - should return 401 without API key', async () => {
      const response = await request(app.getHttpServer()).get('/tenants');
      expect(response.status).toBe(401);
    });
  });

  describe('CRUD operations', () => {
    it('POST /tenants - should create tenant with authenticated user as created_by', async () => {
      const newTenant = {
        title: `Test Tenant ${Date.now()}`,
      };

      const response = await request(app.getHttpServer())
        .post('/tenants')
        .set('X-API-Key', testUserApiKey)
        .send(newTenant);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newTenant.title);
      expect(response.body.created_by).toBe(testUserId);

      createdTenantId = response.body.id;
    });

    it('POST /tenants - should not allow manually setting created_by', async () => {
      const newTenant = {
        title: `Test Tenant Manual ${Date.now()}`,
        created_by: 999999, // Attempt to set manually
      };

      const response = await request(app.getHttpServer())
        .post('/tenants')
        .set('X-API-Key', testUserApiKey)
        .send(newTenant);

      expect(response.status).toBe(201);
      // Should use authenticated user ID, not the manually provided one
      expect(response.body.created_by).toBe(testUserId);
      expect(response.body.created_by).not.toBe(999999);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/tenants/${response.body.id}`)
        .set('X-API-Key', testUserApiKey);
    });

    it('GET /tenants - should return all tenants', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenants')
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const createdTenant = response.body.find((t: { id: number }) => t.id === createdTenantId);
      expect(createdTenant).toBeDefined();
      expect(createdTenant?.created_by).toBe(testUserId);
    });

    it('GET /tenants/:id - should return created tenant', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tenants/${createdTenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdTenantId);
      expect(response.body.created_by).toBe(testUserId);
    });

    it('GET /tenants/:id - should return 404 for non-existent tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenants/999999')
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(404);
    });

    it('PATCH /tenants/:id - should update tenant', async () => {
      const updatedData = {
        title: `Updated Tenant ${Date.now()}`,
      };

      const response = await request(app.getHttpServer())
        .patch(`/tenants/${createdTenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updatedData.title);
      expect(response.body.created_by).toBe(testUserId); // Should remain unchanged
    });

    it('DELETE /tenants/:id - should delete tenant', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/tenants/${createdTenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);

      // Verify tenant is deleted
      const getResponse = await request(app.getHttpServer())
        .get(`/tenants/${createdTenantId}`)
        .set('X-API-Key', testUserApiKey);
      expect(getResponse.status).toBe(404);

      // Clear ID so afterAll doesn't try to delete again
      createdTenantId = 0;
    });
  });

  describe('created_by tracking', () => {
    it('should track different users creating different tenants', async () => {
      // Create second user
      const user2Res = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `tenant-test2-${Date.now()}@example.com`, name: 'Tenant Test User 2' });
      const user2Id = user2Res.body.id;

      const user2ApiKey = `test-key2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await request(app.getHttpServer())
        .post('/api-keys')
        .send({ user_id: user2Id, key: user2ApiKey, name: 'Test Key 2' });

      // Create tenant as first user
      const tenant1Res = await request(app.getHttpServer())
        .post('/tenants')
        .set('X-API-Key', testUserApiKey)
        .send({ title: `Tenant by User 1 ${Date.now()}` });

      // Create tenant as second user
      const tenant2Res = await request(app.getHttpServer())
        .post('/tenants')
        .set('X-API-Key', user2ApiKey)
        .send({ title: `Tenant by User 2 ${Date.now()}` });

      expect(tenant1Res.body.created_by).toBe(testUserId);
      expect(tenant2Res.body.created_by).toBe(user2Id);
      expect(tenant1Res.body.created_by).not.toBe(tenant2Res.body.created_by);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/tenants/${tenant1Res.body.id}`)
        .set('X-API-Key', testUserApiKey);
      await request(app.getHttpServer())
        .delete(`/tenants/${tenant2Res.body.id}`)
        .set('X-API-Key', user2ApiKey);
      await request(app.getHttpServer()).delete(`/users/${user2Id}`);
    });
  });
});
