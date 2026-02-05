import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { TestContext } from './test-context.js';
import {
  expectConflict,
  expectNotFound,
  expectUnauthorized,
  generateUniqueId,
} from './test-helpers.js';

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
      tenantTitle: `Test Tenant ${generateUniqueId()}`,
      userEmail: `users-test-${generateUniqueId()}@example.com`,
      userName: 'Users Test User',
    });
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.users.getUsers());
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.users.getUsers());
    });
  });

  describe('CRUD operations', () => {
    it('should list users with system admin', async () => {
      const users = await ctx.getSystemClient().users.getUsers();
      expect(Array.isArray(users)).toBe(true);
    });

    it('should create user with system admin', async () => {
      const newUser = {
        email: `test-${generateUniqueId()}@example.com`,
        name: 'Test User',
      };

      const user = await ctx.getSystemClient().users.createUser(newUser);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe(newUser.email);
      expect(user.name).toBe(newUser.name);

      createdUserId = user.id;
    });

    it('should get user by id with system admin', async () => {
      const user = await ctx.getSystemClient().users.getUser(createdUserId);
      expect(user.id).toBe(createdUserId);
    });

    it('should return 404 for non-existent user', async () => {
      await expectNotFound(() => ctx.getSystemClient().users.getUser(999999));
    });

    it('should return 409 on duplicate email', async () => {
      const duplicateEmail = `duplicate-${generateUniqueId()}@example.com`;
      await ctx.getSystemClient().users.createUser({
        email: duplicateEmail,
        name: 'First User',
      });

      await expectConflict(() =>
        ctx.getSystemClient().users.createUser({
          email: duplicateEmail,
          name: 'Duplicate User',
        }),
      );
    });
  });

  describe('Delete operations', () => {
    it('should delete user with system admin', async () => {
      await ctx.getSystemClient().users.deleteUser(createdUserId);
      await expectNotFound(() => ctx.getSystemClient().users.getUser(createdUserId));
    });
  });
});
