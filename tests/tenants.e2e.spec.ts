import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { cleanupUser } from './test-helpers.js';

describe('Tenants (e2e)', () => {
  let app: INestApplication;
  let testUserId: number;
  let testUserApiKey: string;
  let systemAdminUserId: number;
  let systemAdminApiKey: string;
  let createdTenantId: number;
  const SYSTEM_ADMIN_KEY = process.env.SYSTEM_ADMIN_KEY!;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user using system admin key
    const userRes = await request(app.getHttpServer())
      .post('/users')
      .set('X-API-Key', SYSTEM_ADMIN_KEY)
      .send({ email: `tenant-test-${Date.now()}@example.com`, name: 'Tenant Test User' });
    testUserId = userRes.body.id;

    // Create API key for test user
    testUserApiKey = `test-key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await request(app.getHttpServer())
      .post('/api-keys')
      .set('X-API-Key', SYSTEM_ADMIN_KEY)
      .send({ user_id: testUserId, key: testUserApiKey, name: 'Test Key' });

    // Create system admin user
    const adminRes = await request(app.getHttpServer())
      .post('/users')
      .set('X-API-Key', SYSTEM_ADMIN_KEY)
      .send({ email: `admin-test-${Date.now()}@example.com`, name: 'System Admin' });
    systemAdminUserId = adminRes.body.id;

    // Create API key for system admin
    systemAdminApiKey = `admin-key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await request(app.getHttpServer())
      .post('/api-keys')
      .set('X-API-Key', SYSTEM_ADMIN_KEY)
      .send({ user_id: systemAdminUserId, key: systemAdminApiKey, name: 'Admin Key' });

    // Get or create systemAdmin role
    const rolesRes = await request(app.getHttpServer())
      .get('/roles')
      .set('X-API-Key', SYSTEM_ADMIN_KEY);
    let systemAdminRoleId = rolesRes.body.find((r: { name: string }) => r.name === 'systemAdmin')
      ?.id;
    if (!systemAdminRoleId) {
      const roleRes = await request(app.getHttpServer())
        .post('/roles')
        .set('X-API-Key', SYSTEM_ADMIN_KEY)
        .send({ name: 'systemAdmin', description: 'System Administrator' });
      systemAdminRoleId = roleRes.body.id;
    }

    // Assign systemAdmin role (no tenant_id, no shop_id = global)
    await request(app.getHttpServer())
      .post('/user-roles')
      .set('X-API-Key', SYSTEM_ADMIN_KEY)
      .send({ user_id: systemAdminUserId, role_id: systemAdminRoleId });
  });

  afterAll(async () => {
    // Cleanup using helper that handles foreign key constraints
    if (testUserId) {
      await cleanupUser(app, testUserId);
    }
    if (systemAdminUserId) {
      await cleanupUser(app, systemAdminUserId);
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
    it('POST /tenants - should create tenant with system admin and set created_by and owner_id', async () => {
      const newTenant = {
        title: `Test Tenant ${Date.now()}`,
        owner_id: testUserId,
      };

      const response = await request(app.getHttpServer())
        .post('/tenants')
        .set('X-API-Key', systemAdminApiKey)
        .send(newTenant);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newTenant.title);
      expect(response.body.created_by).toBe(systemAdminUserId);
      expect(response.body.owner_id).toBe(testUserId);

      createdTenantId = response.body.id;
    });

    it('POST /tenants - should not allow non-admin to create tenant', async () => {
      const newTenant = {
        title: `Test Tenant ${Date.now()}`,
        owner_id: testUserId,
      };

      const response = await request(app.getHttpServer())
        .post('/tenants')
        .set('X-API-Key', testUserApiKey)
        .send(newTenant);

      expect(response.status).toBe(403);
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
      expect(createdTenant?.created_by).toBe(systemAdminUserId);
    });

    it('GET /tenants/:id - should return created tenant', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tenants/${createdTenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdTenantId);
      expect(response.body.created_by).toBe(systemAdminUserId);
    });

    it('GET /tenants/:id - should return 404 for non-existent tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenants/999999')
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(404);
    });

    it('PUT /tenants/:id - should update tenant', async () => {
      const updatedData = {
        title: `Updated Tenant ${Date.now()}`,
      };

      const response = await request(app.getHttpServer())
        .put(`/tenants/${createdTenantId}`)
        .set('X-API-Key', testUserApiKey)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updatedData.title);
      expect(response.body.created_by).toBe(systemAdminUserId); // Should remain unchanged
    });

    it('GET /tenants/:id - should return updated tenant', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tenants/${createdTenantId}`)
        .set('X-API-Key', testUserApiKey);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdTenantId);
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
        .set('X-API-Key', SYSTEM_ADMIN_KEY)
        .send({ email: `tenant-test2-${Date.now()}@example.com`, name: 'Tenant Test User 2' });
      const user2Id = user2Res.body.id;

      const user2ApiKey = `test-key2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await request(app.getHttpServer())
        .post('/api-keys')
        .set('X-API-Key', SYSTEM_ADMIN_KEY)
        .send({ user_id: user2Id, key: user2ApiKey, name: 'Test Key 2' });

      // Create tenant for first user (by system admin)
      const tenant1Res = await request(app.getHttpServer())
        .post('/tenants')
        .set('X-API-Key', systemAdminApiKey)
        .send({ title: `Tenant by User 1 ${Date.now()}`, owner_id: testUserId });

      // Create tenant for second user (by system admin)
      const tenant2Res = await request(app.getHttpServer())
        .post('/tenants')
        .set('X-API-Key', systemAdminApiKey)
        .send({ title: `Tenant by User 2 ${Date.now()}`, owner_id: user2Id });

      expect(tenant1Res.body.created_by).toBe(systemAdminUserId);
      expect(tenant2Res.body.created_by).toBe(systemAdminUserId);
      expect(tenant1Res.body.owner_id).toBe(testUserId);
      expect(tenant2Res.body.owner_id).toBe(user2Id);
      expect(tenant1Res.body.owner_id).not.toBe(tenant2Res.body.owner_id);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/tenants/${tenant1Res.body.id}`)
        .set('X-API-Key', SYSTEM_ADMIN_KEY);
      await request(app.getHttpServer())
        .delete(`/tenants/${tenant2Res.body.id}`)
        .set('X-API-Key', SYSTEM_ADMIN_KEY);
      await request(app.getHttpServer())
        .delete(`/users/${user2Id}`)
        .set('X-API-Key', SYSTEM_ADMIN_KEY);
    });
  });

  describe('Create tenant with shop', () => {
    it('POST /tenants/with-shop-and-user - should return 403 for non-systemAdmin', async () => {
      const response = await request(app.getHttpServer())
        .post('/tenants/with-shop-and-user')
        .set('X-API-Key', testUserApiKey)
        .send({
          tenantTitle: 'Test Company',
          userEmail: `owner-${Date.now()}@test.com`,
          userName: 'Test Owner',
        });

      expect(response.status).toBe(403);
    });

    it('POST /tenants/with-shop-and-user - should create user, tenant, and shop for systemAdmin', async () => {
      const requestData = {
        tenantTitle: `E2E Test Company ${Date.now()}`,
        userEmail: `e2e-owner-${Date.now()}@test.com`,
        userName: 'E2E Test Owner',
      };

      const response = await request(app.getHttpServer())
        .post('/tenants/with-shop-and-user')
        .set('X-API-Key', systemAdminApiKey)
        .send(requestData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('tenant');
      expect(response.body).toHaveProperty('shop');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('apiKey');

      // Verify tenant
      expect(response.body.tenant.title).toBe(requestData.tenantTitle);
      expect(response.body.tenant.owner_id).toBe(response.body.user.id);
      expect(response.body.tenant.created_by).toBe(response.body.user.id);

      // Verify shop - should use tenant title
      expect(response.body.shop.title).toBe(requestData.tenantTitle);
      expect(response.body.shop.tenant_id).toBe(response.body.tenant.id);

      // Verify user
      expect(response.body.user.email).toBe(requestData.userEmail);
      expect(response.body.user.name).toBe(requestData.userName);

      // Verify API key format
      expect(response.body.apiKey).toMatch(/^sk_/);

      // Test that the generated API key works
      const testResponse = await request(app.getHttpServer())
        .get('/me')
        .set('X-API-Key', response.body.apiKey);

      expect(testResponse.status).toBe(200);
      expect(testResponse.body.id).toBe(response.body.user.id);

      // Verify user has tenantAdmin role for the created tenant
      const hasTenantAdminRole = testResponse.body.roles.some(
        (r: { role_name: string; tenant_id: number; shop_id: number | null }) =>
          r.role_name === 'tenantAdmin' &&
          r.tenant_id === response.body.tenant.id &&
          r.shop_id === null,
      );
      expect(hasTenantAdminRole).toBe(true);

      // Verify user has access to the tenant with the created shop
      const tenant = testResponse.body.tenants.find(
        (t: { id: number }) => t.id === response.body.tenant.id,
      );
      expect(tenant).toBeDefined();
      expect(tenant.is_owner).toBe(true);
      expect(tenant.shops).toHaveLength(1);
      expect(tenant.shops[0].id).toBe(response.body.shop.id);
      expect(tenant.shops[0].title).toBe(requestData.tenantTitle);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/tenants/${response.body.tenant.id}`)
        .set('X-API-Key', systemAdminApiKey);
      await request(app.getHttpServer()).delete(`/users/${response.body.user.id}`);
    });
  });
});
