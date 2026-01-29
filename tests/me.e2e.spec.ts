import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

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

    // Create test data
    userEmail = `testuser-${Date.now()}@example.com`;
    const userResponse = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Test User', email: userEmail });
    userId = userResponse.body.id;

    const tenantResponse = await request(app.getHttpServer())
      .post('/tenants')
      .send({ title: `Test Tenant ${Date.now()}`, owner_id: userId });
    tenantId = tenantResponse.body.id;

    const shopResponse = await request(app.getHttpServer())
      .post('/shops')
      .send({ title: `Test Shop ${Date.now()}`, tenant_id: tenantId });
    shopId = shopResponse.body.id;

    apiKey = `test-key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await request(app.getHttpServer())
      .post('/api-keys')
      .send({ user_id: userId, key: apiKey, name: 'Test API Key' });

    // Assign a role
    const rolesResponse = await request(app.getHttpServer()).get('/roles');
    const editorRole = rolesResponse.body.find((r: { name: string }) => r.name === 'editor');

    await request(app.getHttpServer()).post('/user-roles').send({
      user_id: userId,
      role_id: editorRole.id,
      tenant_id: tenantId,
      shop_id: shopId,
    });
  });

  afterAll(async () => {
    // Cleanup
    if (shopId) {
      await request(app.getHttpServer()).delete(`/shops/${shopId}`);
    }
    if (tenantId) {
      await request(app.getHttpServer()).delete(`/tenants/${tenantId}`);
    }
    if (userId) {
      await request(app.getHttpServer()).delete(`/users/${userId}`);
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
    expect(response.body.roles.length).toBeGreaterThan(0);
    const role = response.body.roles[0];
    expect(role).toHaveProperty('role_name', 'editor');
    expect(role).toHaveProperty('tenant_id', tenantId);
    expect(role.tenant_title).toBeTruthy();
    expect(role).toHaveProperty('shop_id', shopId);
    expect(role.shop_title).toBeTruthy();

    // Check tenants
    expect(Array.isArray(response.body.tenants)).toBe(true);
    expect(response.body.tenants.length).toBeGreaterThan(0);
    const tenant = response.body.tenants[0];
    expect(tenant).toHaveProperty('id', tenantId);
    expect(tenant.title).toBeTruthy();
    expect(tenant).toHaveProperty('is_owner', true);
  });
});
