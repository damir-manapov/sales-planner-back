import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { TestContext } from './test-context.js';
import {
  cleanupUser,
  expectForbidden,
  expectNotFound,
  expectUnauthorized,
  generateUniqueId,
} from './test-helpers.js';

describe('API Keys (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;

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
      tenantTitle: `API Keys Test Tenant ${generateUniqueId()}`,
      userEmail: `api-keys-test-${generateUniqueId()}@example.com`,
      userName: 'API Keys Test User',
    });
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.apiKeys.getAll());
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.apiKeys.getAll());
    });
  });

  describe('User managing own API keys', () => {
    let createdKeyId: number;

    it('should list own API keys', async () => {
      const keys = await ctx.client.apiKeys.getAll();

      expect(keys.items).toBeDefined();
      expect(Array.isArray(keys.items)).toBe(true);
      // Should have at least the key used for auth
      expect(keys.items.length).toBeGreaterThanOrEqual(1);
      // All returned keys should belong to the current user
      for (const key of keys.items) {
        expect(key.userId).toBe(ctx.user.id);
      }
    });

    it('should create a new API key for self', async () => {
      const key = await ctx.client.apiKeys.create({
        userId: ctx.user.id,
        name: `Test Key ${generateUniqueId()}`,
      });

      expect(key).toHaveProperty('id');
      expect(key).toHaveProperty('key');
      expect(key.userId).toBe(ctx.user.id);
      expect(key.name).toContain('Test Key');
      createdKeyId = key.id;
    });

    it('should get own API key by id', async () => {
      const key = await ctx.client.apiKeys.getById(createdKeyId);

      expect(key.id).toBe(createdKeyId);
      expect(key.userId).toBe(ctx.user.id);
    });

    it('should revoke (delete) own API key', async () => {
      await ctx.client.apiKeys.delete(createdKeyId);

      await expectNotFound(() => ctx.client.apiKeys.getById(createdKeyId));
    });
  });

  describe('User cannot manage other users keys', () => {
    let otherUserId: number;
    let otherKeyId: number;

    beforeAll(async () => {
      const systemClient = ctx.getSystemClient();

      // Create another user with an API key
      const otherUser = await systemClient.users.create({
        email: `other-user-${generateUniqueId()}@example.com`,
        name: 'Other User',
      });
      otherUserId = otherUser.id;

      const otherKey = await systemClient.apiKeys.create({
        userId: otherUserId,
        name: 'Other User Key',
      });
      otherKeyId = otherKey.id;
    });

    afterAll(async () => {
      if (otherUserId) await cleanupUser(app, otherUserId);
    });

    it('should not be able to create API key for another user', async () => {
      await expectForbidden(() =>
        ctx.client.apiKeys.create({
          userId: otherUserId,
          name: 'Sneaky Key',
        }),
      );
    });

    it('should not be able to get another users API key', async () => {
      await expectForbidden(() => ctx.client.apiKeys.getById(otherKeyId));
    });

    it('should not be able to delete another users API key', async () => {
      await expectForbidden(() => ctx.client.apiKeys.delete(otherKeyId));
    });

    it('should not see other users keys in list', async () => {
      const keys = await ctx.client.apiKeys.getAll();
      const otherKeys = keys.items.filter((k) => k.userId === otherUserId);
      expect(otherKeys).toHaveLength(0);
    });
  });

  describe('System admin managing API keys', () => {
    let adminKeyId: number;

    it('should list all API keys', async () => {
      const keys = await ctx.getSystemClient().apiKeys.getAll();

      expect(keys.items).toBeDefined();
      expect(keys.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter by userId', async () => {
      const keys = await ctx.getSystemClient().apiKeys.getAll({ userId: ctx.user.id });

      expect(keys.items.length).toBeGreaterThanOrEqual(1);
      for (const key of keys.items) {
        expect(key.userId).toBe(ctx.user.id);
      }
    });

    it('should create API key for any user', async () => {
      const key = await ctx.getSystemClient().apiKeys.create({
        userId: ctx.user.id,
        name: `Admin Created Key ${generateUniqueId()}`,
      });

      expect(key).toHaveProperty('id');
      expect(key.userId).toBe(ctx.user.id);
      adminKeyId = key.id;
    });

    it('should get any API key by id', async () => {
      const key = await ctx.getSystemClient().apiKeys.getById(adminKeyId);

      expect(key.id).toBe(adminKeyId);
    });

    it('should delete any API key', async () => {
      await ctx.getSystemClient().apiKeys.delete(adminKeyId);

      await expectNotFound(() => ctx.getSystemClient().apiKeys.getById(adminKeyId));
    });
  });
});
