import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { SalesPlannerClient, ApiError } from '@sales-planner/http-client';
import { cleanupUser, SYSTEM_ADMIN_KEY } from './test-helpers.js';

describe('Tenants (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let systemClient: SalesPlannerClient;
  let adminClient: SalesPlannerClient;
  let userClient: SalesPlannerClient;
  let testUserId: number;
  let systemAdminUserId: number;
  let createdTenantId: number;

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

    // Create test user
    const testUser = await systemClient.createUser({
      email: `tenant-test-${Date.now()}@example.com`,
      name: 'Tenant Test User',
    });
    testUserId = testUser.id;
    const testUserApiKey = await systemClient.createApiKey({ user_id: testUserId, name: 'Test Key' });

    userClient = new SalesPlannerClient({ baseUrl, apiKey: testUserApiKey.key });

    // Create system admin user
    const adminUser = await systemClient.createUser({
      email: `admin-test-${Date.now()}@example.com`,
      name: 'System Admin',
    });
    systemAdminUserId = adminUser.id;
    const adminApiKey = await systemClient.createApiKey({
      user_id: systemAdminUserId,
      name: 'Admin Key',
    });

    // Get systemAdmin role and assign it
    const roles = await systemClient.getRoles();
    const sysAdminRole = roles.find((r) => r.name === 'systemAdmin');
    if (sysAdminRole) {
      await systemClient.createUserRole({ user_id: systemAdminUserId, role_id: sysAdminRole.id });
    }

    // Create adminClient that uses the created admin's API key
    adminClient = new SalesPlannerClient({ baseUrl, apiKey: adminApiKey.key });
  });

  afterAll(async () => {
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
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });

      try {
        await noAuthClient.createTenant({ title: 'Test Tenant' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });

    it('POST /tenants - should return 401 with invalid API key', async () => {
      const invalidClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });

      try {
        await invalidClient.createTenant({ title: 'Test Tenant' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });

    it('GET /tenants - should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });

      try {
        await noAuthClient.getTenants();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });
  });

  describe('CRUD operations', () => {
    it('POST /tenants - should create tenant with system admin and set created_by and owner_id', async () => {
      const newTenant = {
        title: `Test Tenant ${Date.now()}`,
        owner_id: testUserId,
      };

      const tenant = await adminClient.createTenant(newTenant);

      expect(tenant).toHaveProperty('id');
      expect(tenant.title).toBe(newTenant.title);
      expect(tenant.created_by).toBe(systemAdminUserId);
      expect(tenant.owner_id).toBe(testUserId);

      createdTenantId = tenant.id;
    });

    it('POST /tenants - should not allow non-admin to create tenant', async () => {
      try {
        await userClient.createTenant({
          title: `Test Tenant ${Date.now()}`,
          owner_id: testUserId,
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });

    it('GET /tenants - should return all tenants', async () => {
      const tenants = await userClient.getTenants();

      expect(Array.isArray(tenants)).toBe(true);
      expect(tenants.length).toBeGreaterThan(0);

      const createdTenant = tenants.find((t) => t.id === createdTenantId);
      expect(createdTenant).toBeDefined();
      expect(createdTenant?.created_by).toBe(systemAdminUserId);
    });

    it('GET /tenants/:id - should return created tenant', async () => {
      const tenant = await userClient.getTenant(createdTenantId);

      expect(tenant.id).toBe(createdTenantId);
      expect(tenant.created_by).toBe(systemAdminUserId);
    });

    it('GET /tenants/:id - should return 404 for non-existent tenant', async () => {
      try {
        await userClient.getTenant(999999);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }
    });

    it('PUT /tenants/:id - should update tenant', async () => {
      const updatedData = { title: `Updated Tenant ${Date.now()}` };

      const tenant = await userClient.updateTenant(createdTenantId, updatedData);

      expect(tenant.title).toBe(updatedData.title);
      expect(tenant.created_by).toBe(systemAdminUserId); // Should remain unchanged
    });

    it('GET /tenants/:id - should return updated tenant', async () => {
      const tenant = await userClient.getTenant(createdTenantId);
      expect(tenant.id).toBe(createdTenantId);
    });

    it('DELETE /tenants/:id - should delete tenant', async () => {
      await userClient.deleteTenant(createdTenantId);

      // Verify tenant is deleted
      try {
        await userClient.getTenant(createdTenantId);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }

      createdTenantId = 0;
    });
  });

  describe('created_by tracking', () => {
    it('should track different users creating different tenants', async () => {
      // Create second user
      const user2 = await systemClient.createUser({
        email: `tenant-test2-${Date.now()}@example.com`,
        name: 'Tenant Test User 2',
      });

      // Create tenant for first user (by admin user)
      const tenant1 = await adminClient.createTenant({
        title: `Tenant by User 1 ${Date.now()}`,
        owner_id: testUserId,
      });

      // Create tenant for second user (by admin user)
      const tenant2 = await adminClient.createTenant({
        title: `Tenant by User 2 ${Date.now()}`,
        owner_id: user2.id,
      });

      expect(tenant1.created_by).toBe(systemAdminUserId);
      expect(tenant2.created_by).toBe(systemAdminUserId);
      expect(tenant1.owner_id).toBe(testUserId);
      expect(tenant2.owner_id).toBe(user2.id);
      expect(tenant1.owner_id).not.toBe(tenant2.owner_id);

      // Cleanup
      await cleanupUser(app, user2.id);
      await adminClient.deleteTenant(tenant1.id);
    });
  });

  describe('Create tenant with shop', () => {
    it('POST /tenants/with-shop-and-user - should return 403 for non-systemAdmin', async () => {
      try {
        await userClient.createTenantWithShopAndUser({
          tenantTitle: 'Test Company',
          userEmail: `owner-${Date.now()}@test.com`,
          userName: 'Test Owner',
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });

    it('POST /tenants/with-shop-and-user - should create user, tenant, and shop for systemAdmin', async () => {
      const requestData = {
        tenantTitle: `E2E Test Company ${Date.now()}`,
        userEmail: `e2e-owner-${Date.now()}@test.com`,
        userName: 'E2E Test Owner',
      };

      const result = await systemClient.createTenantWithShopAndUser(requestData);

      expect(result).toHaveProperty('tenant');
      expect(result).toHaveProperty('shop');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('apiKey');

      // Verify tenant
      expect(result.tenant.title).toBe(requestData.tenantTitle);
      expect(result.tenant.owner_id).toBe(result.user.id);
      expect(result.tenant.created_by).toBe(result.user.id);

      // Verify shop - should use tenant title
      expect(result.shop.title).toBe(requestData.tenantTitle);
      expect(result.shop.tenant_id).toBe(result.tenant.id);

      // Verify user
      expect(result.user.email).toBe(requestData.userEmail);
      expect(result.user.name).toBe(requestData.userName);

      // Verify API key format
      expect(result.apiKey).toMatch(/^sk_/);

      // Test that the generated API key works
      const newClient = new SalesPlannerClient({ baseUrl, apiKey: result.apiKey });
      const me = await newClient.getMe();

      expect(me.id).toBe(result.user.id);

      // Verify user has tenantAdmin role for the created tenant
      const hasTenantAdminRole = me.roles.some(
        (r) =>
          r.role_name === 'tenantAdmin' && r.tenant_id === result.tenant.id && r.shop_id === null,
      );
      expect(hasTenantAdminRole).toBe(true);

      // Verify user has access to the tenant with the created shop
      const tenant = me.tenants.find((t) => t.id === result.tenant.id);
      expect(tenant).toBeDefined();
      expect(tenant?.is_owner).toBe(true);
      expect(tenant?.shops).toHaveLength(1);
      expect(tenant?.shops[0]?.id).toBe(result.shop.id);
      expect(tenant?.shops[0]?.title).toBe(requestData.tenantTitle);

      // Cleanup
      await systemClient.deleteTenant(result.tenant.id);
      await systemClient.deleteUser(result.user.id);
    });
  });
});
