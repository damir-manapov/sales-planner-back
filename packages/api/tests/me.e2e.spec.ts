import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError, SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ROLE_NAMES } from '../src/common/constants.js';
import { TestContext } from './test-context.js';
import { generateUniqueId } from './test-helpers.js';

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
    const tenantAdminRole = me.roles.find((r) => r.role_name === ROLE_NAMES.TENANT_ADMIN);
    expect(tenantAdminRole).toBeTruthy();
    expect(tenantAdminRole).toHaveProperty('tenant_id', ctx.tenant.id);
    expect(tenantAdminRole?.tenant_title).toBeTruthy();
    expect(tenantAdminRole).toHaveProperty('shop_id', null); // Tenant-level role

    // Verify derived tenantOwner role
    const ownerRole = me.roles.find((r) => r.role_name === ROLE_NAMES.TENANT_OWNER);
    expect(ownerRole).toBeTruthy();
    expect(ownerRole).toHaveProperty('role_name', ROLE_NAMES.TENANT_OWNER);
    expect(ownerRole).toHaveProperty('tenant_id', ctx.tenant.id);
    expect(ownerRole?.tenant_title).toBeTruthy();
    expect(ownerRole).toHaveProperty('shop_id', null);
    expect(ownerRole).toHaveProperty('shop_title', null);

    // Check tenants
    expect(Array.isArray(me.tenants)).toBe(true);
    expect(me.tenants.length).toBeGreaterThan(0);
    const tenant = me.tenants[0];
    if (!tenant) throw new Error('Expected tenant');
    expect(tenant).toBeDefined();
    expect(tenant).toHaveProperty('id', ctx.tenant.id);
    expect(tenant?.title).toBeTruthy();
    expect(tenant).toHaveProperty('is_owner', true);

    // Verify shops are included in tenant (tenant admin sees all shops)
    expect(Array.isArray(tenant?.shops)).toBe(true);
    expect(tenant?.shops?.length).toBe(1); // One shop created by with-shop-and-user
    expect(tenant?.shops?.[0]?.id).toBe(ctx.shop.id);
  });
});
