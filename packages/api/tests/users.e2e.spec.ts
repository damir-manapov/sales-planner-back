import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { SalesPlannerClient, ApiError } from '@sales-planner/http-client';
import { cleanupUser, SYSTEM_ADMIN_KEY } from './test-helpers.js';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let systemClient: SalesPlannerClient;
  let createdUserId: number;
  let testUserId: number;

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

    // Create tenant with shop and user (for tenant admin role)
    const setup = await systemClient.createTenantWithShopAndUser({
      tenantTitle: `Test Tenant ${Date.now()}`,
      userEmail: `users-test-${Date.now()}@example.com`,
      userName: 'Users Test User',
    });

    testUserId = setup.user.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await cleanupUser(app, testUserId);
    }
    await app.close();
  });

  it('GET /users - should return users with system admin', async () => {
    const users = await systemClient.getUsers();
    expect(Array.isArray(users)).toBe(true);
  });

  it('POST /users - should create a user with system admin', async () => {
    const newUser = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
    };

    const user = await systemClient.createUser(newUser);

    expect(user).toHaveProperty('id');
    expect(user.email).toBe(newUser.email);
    expect(user.name).toBe(newUser.name);

    createdUserId = user.id;
  });

  it('GET /users/:id - should return created user with system admin', async () => {
    const user = await systemClient.getUser(createdUserId);

    expect(user.id).toBe(createdUserId);
  });

  it('GET /users/:id - should return 404 for non-existent user', async () => {
    try {
      await systemClient.getUser(999999);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(404);
    }
  });

  it('DELETE /users/:id - should delete created user with system admin', async () => {
    await systemClient.deleteUser(createdUserId);

    // Verify user is deleted
    try {
      await systemClient.getUser(createdUserId);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(404);
    }
  });

  it('POST /users - should return 409 on duplicate email', async () => {
    const duplicateEmail = `duplicate-${Date.now()}@example.com`;
    await systemClient.createUser({
      email: duplicateEmail,
      name: 'First User',
    });

    try {
      await systemClient.createUser({
        email: duplicateEmail,
        name: 'Duplicate User',
      });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(409);
    }
  });

  it('GET /users - should return 401 without API key', async () => {
    const noAuthClient = new SalesPlannerClient({
      baseUrl,
      apiKey: '',
    });

    try {
      await noAuthClient.getUsers();
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(401);
    }
  });
});
