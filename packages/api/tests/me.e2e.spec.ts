import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError, SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ROLE_NAMES } from '../src/common/constants.js';
import { TestContext } from './test-context.js';
import { cleanupUser, generateUniqueId, SYSTEM_ADMIN_KEY } from './test-helpers.js';

describe('Me (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let userEmail: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);

    const url = await app.getUrl();
    baseUrl = url.replace('[::1]', 'localhost');

    userEmail = `testuser-${generateUniqueId()}@example.com`;
    ctx = await TestContext.create(app, baseUrl, {
      userEmail,
      userName: 'Test User',
    });
  });

  afterAll(async () => {
    if (ctx) {
      await ctx.dispose();
    }
    await app.close();
  });

  it('GET /me - should return 401 without API key', async () => {
    const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });

    try {
      await noAuthClient.me.getMe();
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(401);
    }
  });

  it('GET /me - should return 401 with invalid API key', async () => {
    const invalidClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });

    try {
      await invalidClient.me.getMe();
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(401);
    }
  });

  it('GET /me - should return current user with roles and tenants', async () => {
    const me = await ctx.client.me.getMe();

    expect(me).toHaveProperty('id', ctx.user.id);
    expect(me).toHaveProperty('name', 'Test User');
    expect(me).toHaveProperty('email', userEmail);
    expect(me).toHaveProperty('roles');
    expect(me).toHaveProperty('tenants');

    // Check roles
    expect(Array.isArray(me.roles)).toBe(true);
    expect(me.roles.length).toBeGreaterThanOrEqual(1); // Should have at least tenantAdmin role

    // Verify tenantAdmin role (assigned by with-shop-and-user endpoint)
    const tenantAdminRole = me.roles.find((r) => r.roleName === ROLE_NAMES.TENANT_ADMIN);
    expect(tenantAdminRole).toBeTruthy();
    expect(tenantAdminRole).toHaveProperty('tenantId', ctx.tenant.id);
    expect(tenantAdminRole?.tenantTitle).toBeTruthy();
    expect(tenantAdminRole).toHaveProperty('shopId', null); // Tenant-level role

    // Verify derived tenantOwner role
    const ownerRole = me.roles.find((r) => r.roleName === ROLE_NAMES.TENANT_OWNER);
    expect(ownerRole).toBeTruthy();
    expect(ownerRole).toHaveProperty('roleName', ROLE_NAMES.TENANT_OWNER);
    expect(ownerRole).toHaveProperty('tenantId', ctx.tenant.id);
    expect(ownerRole?.tenantTitle).toBeTruthy();
    expect(ownerRole).toHaveProperty('shopId', null);
    expect(ownerRole).toHaveProperty('shopTitle', null);

    // Check tenants
    expect(Array.isArray(me.tenants)).toBe(true);
    expect(me.tenants.length).toBeGreaterThan(0);
    const tenant = me.tenants[0];
    if (!tenant) throw new Error('Expected tenant');
    expect(tenant).toBeDefined();
    expect(tenant).toHaveProperty('id', ctx.tenant.id);
    expect(tenant?.title).toBeTruthy();
    expect(tenant).toHaveProperty('isOwner', true);

    // Verify shops are included in tenant (tenant admin sees all shops)
    expect(Array.isArray(tenant?.shops)).toBe(true);
    expect(tenant?.shops?.length).toBe(1); // One shop created by with-shop-and-user
    expect(tenant?.shops?.[0]?.id).toBe(ctx.shop.id);
  });

  describe('Shop visibility', () => {
    it('tenant owner should see all shops including newly added ones', async () => {
      // Owner already has 1 shop from quick setup. Add a second shop.
      const shop2 = await ctx.client.shops.create({
        title: `Extra Shop ${generateUniqueId()}`,
        tenantId: ctx.tenant.id,
      });

      const me = await ctx.client.me.getMe();
      const tenant = me.tenants.find((t) => t.id === ctx.tenant.id);

      expect(tenant).toBeDefined();
      expect(tenant?.isOwner).toBe(true);
      expect(tenant?.shops?.length).toBe(2);
      expect(tenant?.shops?.map((s) => s.id)).toContain(ctx.shop.id);
      expect(tenant?.shops?.map((s) => s.id)).toContain(shop2.id);

      // Cleanup
      await ctx.client.shops.delete(shop2.id);
    });

    it('tenantAdmin (non-owner) should see all shops', async () => {
      const systemClient = new SalesPlannerClient({ baseUrl, apiKey: SYSTEM_ADMIN_KEY });

      // Create a new user
      const adminUser = await systemClient.users.create({
        email: `tenant-admin-${generateUniqueId()}@test.com`,
        name: 'Tenant Admin',
      });
      const adminApiKey = await systemClient.apiKeys.create({
        userId: adminUser.id,
        name: 'Admin Key',
      });

      // Assign tenantAdmin role (not owner)
      const roles = await systemClient.roles.getAll();
      const tenantAdminRole = roles.items.find((r) => r.name === ROLE_NAMES.TENANT_ADMIN);
      if (!tenantAdminRole) throw new Error('tenantAdmin role not found');
      await systemClient.userRoles.create({
        userId: adminUser.id,
        roleId: tenantAdminRole.id,
        tenantId: ctx.tenant.id,
      });

      // Add a second shop
      const shop2 = await ctx.client.shops.create({
        title: `Admin Shop ${generateUniqueId()}`,
        tenantId: ctx.tenant.id,
      });

      const adminClient = new SalesPlannerClient({ baseUrl, apiKey: adminApiKey.key });
      const me = await adminClient.me.getMe();
      const tenant = me.tenants.find((t) => t.id === ctx.tenant.id);

      expect(tenant).toBeDefined();
      expect(tenant?.isOwner).toBe(false);
      expect(tenant?.shops?.length).toBe(2);
      expect(tenant?.shops?.map((s) => s.id)).toContain(ctx.shop.id);
      expect(tenant?.shops?.map((s) => s.id)).toContain(shop2.id);

      // Cleanup
      await ctx.client.shops.delete(shop2.id);
      await cleanupUser(app, adminUser.id);
    });

    it('shop-level role user should only see assigned shop', async () => {
      // Add a second shop that the editor should NOT see
      const shop2 = await ctx.client.shops.create({
        title: `Hidden Shop ${generateUniqueId()}`,
        tenantId: ctx.tenant.id,
      });

      // createUser assigns editor role to ctx.shop only
      const { user: editor, client: editorClient } = await ctx.createUser(
        `editor-${generateUniqueId()}@test.com`,
        'Editor User',
      );

      const me = await editorClient.me.getMe();
      const tenant = me.tenants.find((t) => t.id === ctx.tenant.id);

      expect(tenant).toBeDefined();
      expect(tenant?.isOwner).toBe(false);
      expect(tenant?.shops?.length).toBe(1);
      expect(tenant?.shops?.[0]?.id).toBe(ctx.shop.id);
      // Should NOT see shop2
      expect(tenant?.shops?.map((s) => s.id)).not.toContain(shop2.id);

      // Cleanup
      await ctx.client.shops.delete(shop2.id);
      await cleanupUser(app, editor.id);
    });

    it('user with no roles should see no tenants', async () => {
      const systemClient = new SalesPlannerClient({ baseUrl, apiKey: SYSTEM_ADMIN_KEY });

      const noRoleUser = await systemClient.users.create({
        email: `norole-${generateUniqueId()}@test.com`,
        name: 'No Role User',
      });
      const noRoleApiKey = await systemClient.apiKeys.create({
        userId: noRoleUser.id,
        name: 'No Role Key',
      });

      const noRoleClient = new SalesPlannerClient({ baseUrl, apiKey: noRoleApiKey.key });
      const me = await noRoleClient.me.getMe();

      expect(me.tenants).toHaveLength(0);
      expect(me.roles).toHaveLength(0);

      // Cleanup
      await cleanupUser(app, noRoleUser.id);
    });
  });
});
