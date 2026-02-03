import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { cleanupUser, SYSTEM_ADMIN_KEY } from './test-helpers.js';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let createdUserId: number;
  let testUserId: number;
  let tenantId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create tenant with shop and user (for tenant admin role)
    const setupRes = await request(app.getHttpServer())
      .post('/tenants/with-shop-and-user')
      .set('X-API-Key', SYSTEM_ADMIN_KEY)
      .send({
        tenantTitle: `Test Tenant ${Date.now()}`,
        userEmail: `users-test-${Date.now()}@example.com`,
        userName: 'Users Test User',
      });

    testUserId = setupRes.body.user.id;
    tenantId = setupRes.body.tenant.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await cleanupUser(app, testUserId);
    }
    await app.close();
  });

  it('GET /users - should return users with system admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .set('X-API-Key', SYSTEM_ADMIN_KEY);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('POST /users - should create a user with system admin', async () => {
    const newUser = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
    };

    const response = await request(app.getHttpServer())
      .post('/users')
      .set('X-API-Key', SYSTEM_ADMIN_KEY)
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(newUser.email);
    expect(response.body.name).toBe(newUser.name);

    createdUserId = response.body.id;
  });

  it('GET /users/:id - should return created user with system admin', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${createdUserId}`)
      .set('X-API-Key', SYSTEM_ADMIN_KEY);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdUserId);
  });

  it('GET /users/:id - should return 404 for non-existent user', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/999999')
      .set('X-API-Key', SYSTEM_ADMIN_KEY);

    expect(response.status).toBe(404);
  });

  it('DELETE /users/:id - should delete created user with system admin', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/users/${createdUserId}`)
      .set('X-API-Key', SYSTEM_ADMIN_KEY);

    expect(response.status).toBe(200);

    // Verify user is deleted
    const getResponse = await request(app.getHttpServer())
      .get(`/users/${createdUserId}`)
      .set('X-API-Key', SYSTEM_ADMIN_KEY);
    expect(getResponse.status).toBe(404);
  });

  it('GET /users - should return 401 without API key', async () => {
    const response = await request(app.getHttpServer()).get('/users');
    expect(response.status).toBe(401);
  });
});
