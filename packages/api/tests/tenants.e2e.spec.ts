import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ROLE_NAMES } from '../src/common/constants.js';
import { TestContext } from './test-context.js';
import {
  cleanupUser,
  expectForbidden,
  expectNotFound,
  expectUnauthorized,
  generateUniqueId,
} from './test-helpers.js';

describe('Tenants (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let userClient: SalesPlannerClient;
  let adminClient: SalesPlannerClient;
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

    ctx = await TestContext.create(app, baseUrl, {
      tenantTitle: `Test Tenant ${generateUniqueId()}`,
      userEmail: `tenant-test-${generateUniqueId()}@example.com`,
      userName: 'Tenant Test User',
    });

    // Create a regular user without any roles
    const testUserSetup = await ctx.createUser(
      `regular-user-${generateUniqueId()}@example.com`,
      'Regular User',
    );
    userClient = testUserSetup.client;

    // Create system admin user
    const adminUser = await ctx.getSystemClient().users.create({
      email: `admin-test-${generateUniqueId()}@example.com`,
      name: 'System Admin',
    });
    systemAdminUserId = adminUser.id;
    const adminApiKey = await ctx.getSystemClient().apiKeys.create({
      user_id: systemAdminUserId,
      name: 'Admin Key',
    });

    // Get systemAdmin role and assign it
    const roles = await ctx.getSystemClient().roles.getAll();
    const sysAdminRole = roles.items.find((r) => r.name === ROLE_NAMES.SYSTEM_ADMIN);
    if (sysAdminRole) {
      await ctx
        .getSystemClient()
        .userRoles.create({ user_id: systemAdminUserId, role_id: sysAdminRole.id });
    }

    // Create adminClient that uses the created admin's API key
    adminClient = new SalesPlannerClient({ baseUrl, apiKey: adminApiKey.key });
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    if (systemAdminUserId) {
      await cleanupUser(app, systemAdminUserId);
    }
    await app.close();
  });

  describe('Authentication', () => {
    it('POST /tenants - should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });

      await expectUnauthorized(() => noAuthClient.tenants.create({ title: 'Test Tenant' }));
    });

    it('POST /tenants - should return 401 with invalid API key', async () => {
      const invalidClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });

      await expectUnauthorized(() => invalidClient.tenants.create({ title: 'Test Tenant' }));
    });

    it('GET /tenants - should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });

      await expectUnauthorized(() => noAuthClient.tenants.getAll());
    });
  });

  describe('CRUD operations', () => {
    it('POST /tenants - should create tenant with system admin and set created_by and owner_id', async () => {
      const newTenant = {
        title: `Test Tenant ${generateUniqueId()}`,
        owner_id: ctx.user.id,
      };

      const tenant = await adminClient.tenants.create(newTenant);

      expect(tenant).toHaveProperty('id');
      expect(tenant.title).toBe(newTenant.title);
      expect(tenant.created_by).toBe(systemAdminUserId);
      expect(tenant.owner_id).toBe(ctx.user.id);

      createdTenantId = tenant.id;
    });

    it('POST /tenants - should not allow non-admin to create tenant', async () => {
      await expectForbidden(() =>
        userClient.tenants.create({
          title: `Test Tenant ${generateUniqueId()}`,
          owner_id: ctx.user.id,
        }),
      );
    });

    it('GET /tenants - should return all tenants', async () => {
      const tenants = await userClient.tenants.getAll();

      expect(Array.isArray(tenants.items)).toBe(true);
      expect(tenants.items.length).toBeGreaterThan(0);

      const createdTenant = tenants.items.find((t) => t.id === createdTenantId);
      expect(createdTenant).toBeDefined();
      expect(createdTenant?.created_by).toBe(systemAdminUserId);
    });

    it('GET /tenants/:id - should return created tenant', async () => {
      const tenant = await userClient.tenants.getById(createdTenantId);

      expect(tenant.id).toBe(createdTenantId);
      expect(tenant.created_by).toBe(systemAdminUserId);
    });

    it('GET /tenants/:id - should return 404 for non-existent tenant', async () => {
      await expectNotFound(() => userClient.tenants.getById(999999));
    });

    it('PUT /tenants/:id - should update tenant', async () => {
      const updatedData = { title: `Updated Tenant ${generateUniqueId()}` };

      const tenant = await userClient.tenants.update(createdTenantId, updatedData);

      expect(tenant.title).toBe(updatedData.title);
      expect(tenant.created_by).toBe(systemAdminUserId); // Should remain unchanged
    });

    it('GET /tenants/:id - should return updated tenant', async () => {
      const tenant = await userClient.tenants.getById(createdTenantId);
      expect(tenant.id).toBe(createdTenantId);
    });

    it('DELETE /tenants/:id - should delete tenant', async () => {
      await userClient.tenants.delete(createdTenantId);

      // Verify tenant is deleted
      await expectNotFound(() => userClient.tenants.getById(createdTenantId));
    });
  });

  describe('created_by tracking', () => {
    it('should track different users creating different tenants', async () => {
      // Create second user
      const user2 = await ctx.getSystemClient().users.create({
        email: `tenant-test2-${generateUniqueId()}@example.com`,
        name: 'Tenant Test User 2',
      });

      // Create tenant for first user (by admin user)
      const tenant1 = await adminClient.tenants.create({
        title: `Tenant by User 1 ${generateUniqueId()}`,
        owner_id: ctx.user.id,
      });

      // Create tenant for second user (by admin user)
      const tenant2 = await adminClient.tenants.create({
        title: `Tenant by User 2 ${generateUniqueId()}`,
        owner_id: user2.id,
      });

      expect(tenant1.created_by).toBe(systemAdminUserId);
      expect(tenant2.created_by).toBe(systemAdminUserId);
      expect(tenant1.owner_id).toBe(ctx.user.id);
      expect(tenant2.owner_id).toBe(user2.id);
      expect(tenant1.owner_id).not.toBe(tenant2.owner_id);

      // Cleanup
      await cleanupUser(app, user2.id);
      await adminClient.tenants.delete(tenant1.id);
    });
  });

  describe('Create tenant with shop', () => {
    it('POST /tenants/with-shop-and-user - should return 403 for non-systemAdmin', async () => {
      await expectForbidden(() =>
        userClient.tenants.createWithShopAndUser({
          tenantTitle: 'Test Company',
          userEmail: `owner-${generateUniqueId()}@test.com`,
          userName: 'Test Owner',
        }),
      );
    });

    it('POST /tenants/with-shop-and-user - should create user, tenant, and shop for systemAdmin', async () => {
      const requestData = {
        tenantTitle: `E2E Test Company ${generateUniqueId()}`,
        userEmail: `e2e-owner-${generateUniqueId()}@test.com`,
        userName: 'E2E Test Owner',
      };

      const result = await ctx.getSystemClient().tenants.createWithShopAndUser(requestData);

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
      const me = await newClient.me.getMe();

      expect(me.id).toBe(result.user.id);

      // Verify user has tenantAdmin role for the created tenant
      const hasTenantAdminRole = me.roles.some(
        (r) =>
          r.role_name === ROLE_NAMES.TENANT_ADMIN &&
          r.tenant_id === result.tenant.id &&
          r.shop_id === null,
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
      await ctx.getSystemClient().tenants.delete(result.tenant.id);
      await ctx.getSystemClient().users.delete(result.user.id);
    });
  });
});
