import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { cleanupUser, SYSTEM_ADMIN_KEY } from './test-helpers.js';
import { ROLE_NAMES } from '../src/common/constants.js';

describe('Me (e2e)', () => {
  let app: INestApplication;
  let apiKey: string;
  let userId: number;
  let tenantId: number;
  let shopId: number;
  let userEmail: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create tenant with shop and user in one call
    userEmail = `testuser-${Date.now()}@example.com`;
    const setupRes = await request(app.getHttpServer())
      .post('/tenants/with-shop-and-user')
      .set('X-API-Key', SYSTEM_ADMIN_KEY)
      .send({
        tenantTitle: `Test Tenant ${Date.now()}`,
        userEmail: userEmail,
        userName: 'Test User',
      });

    userId = setupRes.body.user.id;
    apiKey = setupRes.body.apiKey;
    tenantId = setupRes.body.tenant.id;
    shopId = setupRes.body.shop.id;
  });

  afterAll(async () => {
    // Cleanup using helper that handles foreign key constraints
    if (userId) {
      await cleanupUser(app, userId);
    }
    await app.close();
  });

  it('GET /me - should return 401 without API key', async () => {
    const response = await request(app.getHttpServer()).get('/me');
    expect(response.status).toBe(401);
  });

  it('GET /me - should return 401 with invalid API key', async () => {
    const response = await request(app.getHttpServer()).get('/me').set('x-api-key', 'invalid-key');
    expect(response.status).toBe(401);
  });

  it('GET /me - should return current user with roles and tenants', async () => {
    const response = await request(app.getHttpServer()).get('/me').set('x-api-key', apiKey);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', userId);
    expect(response.body).toHaveProperty('name', 'Test User');
    expect(response.body).toHaveProperty('email', userEmail);
    expect(response.body).toHaveProperty('roles');
    expect(response.body).toHaveProperty('tenants');

    // Check roles
    expect(Array.isArray(response.body.roles)).toBe(true);
    expect(response.body.roles.length).toBeGreaterThanOrEqual(1); // Should have at least tenantAdmin role

    // Verify tenantAdmin role (assigned by with-shop-and-user endpoint)
    const tenantAdminRole = response.body.roles.find((r: { role_name: string }) => r.role_name === ROLE_NAMES.TENANT_ADMIN);
    expect(tenantAdminRole).toBeTruthy();
    expect(tenantAdminRole).toHaveProperty('tenant_id', tenantId);
    expect(tenantAdminRole.tenant_title).toBeTruthy();
    expect(tenantAdminRole).toHaveProperty('shop_id', null); // Tenant-level role

    // Verify derived tenantOwner role
    const ownerRole = response.body.roles.find((r: { role_name: string }) => r.role_name === ROLE_NAMES.TENANT_OWNER);
    expect(ownerRole).toBeTruthy();
    expect(ownerRole).toHaveProperty('role_name', ROLE_NAMES.TENANT_OWNER);
    expect(ownerRole).toHaveProperty('tenant_id', tenantId);
    expect(ownerRole.tenant_title).toBeTruthy();
    expect(ownerRole).toHaveProperty('shop_id', null);
    expect(ownerRole).toHaveProperty('shop_title', null);

    // Check tenants
    expect(Array.isArray(response.body.tenants)).toBe(true);
    expect(response.body.tenants.length).toBeGreaterThan(0);
    const tenant = response.body.tenants[0];
    expect(tenant).toHaveProperty('id', tenantId);
    expect(tenant.title).toBeTruthy();
    expect(tenant).toHaveProperty('is_owner', true);

    // Verify shops are included in tenant (tenant admin sees all shops)
    expect(Array.isArray(tenant.shops)).toBe(true);
    expect(tenant.shops.length).toBe(1); // One shop created by with-shop-and-user
    expect(tenant.shops[0].id).toBe(shopId);
  });
});
