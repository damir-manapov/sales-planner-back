import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError, SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { TestContext } from './test-context.js';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let createdUserId: number;

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
      tenantTitle: `Test Tenant ${Date.now()}`,
      userEmail: `users-test-${Date.now()}@example.com`,
      userName: 'Users Test User',
    });
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  it('GET /users - should return users with system admin', async () => {
    const users = await ctx.getSystemClient().getUsers();
    expect(Array.isArray(users)).toBe(true);
  });

  it('POST /users - should create a user with system admin', async () => {
    const newUser = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
    };

    const user = await ctx.getSystemClient().createUser(newUser);

    expect(user).toHaveProperty('id');
    expect(user.email).toBe(newUser.email);
    expect(user.name).toBe(newUser.name);

    createdUserId = user.id;
  });

  it('GET /users/:id - should return created user with system admin', async () => {
    const user = await ctx.getSystemClient().getUser(createdUserId);

    expect(user.id).toBe(createdUserId);
  });

  it('GET /users/:id - should return 404 for non-existent user', async () => {
    try {
      await ctx.getSystemClient().getUser(999999);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(404);
    }
  });

  it('DELETE /users/:id - should delete created user with system admin', async () => {
    await ctx.getSystemClient().deleteUser(createdUserId);

    // Verify user is deleted
    try {
      await ctx.getSystemClient().getUser(createdUserId);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(404);
    }
  });

  it('POST /users - should return 409 on duplicate email', async () => {
    const duplicateEmail = `duplicate-${Date.now()}@example.com`;
    await ctx.getSystemClient().createUser({
      email: duplicateEmail,
      name: 'First User',
    });

    try {
      await ctx.getSystemClient().createUser({
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
