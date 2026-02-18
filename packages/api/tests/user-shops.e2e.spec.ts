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

describe('User Shops (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let ctx2: TestContext; // Second tenant for cross-tenant tests

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
      tenantTitle: `UserShops Test Tenant ${generateUniqueId()}`,
      userEmail: `user-shops-test-${generateUniqueId()}@example.com`,
      userName: 'UserShops Test User',
    });

    ctx2 = await TestContext.create(app, baseUrl, {
      tenantTitle: `UserShops Other Tenant ${generateUniqueId()}`,
      userEmail: `user-shops-other-${generateUniqueId()}@example.com`,
      userName: 'UserShops Other User',
    });
  });

  afterAll(async () => {
    if (ctx2) await ctx2.dispose();
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.userShops.getAll({ shopId: ctx.shop.id }));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.userShops.getAll({ shopId: ctx.shop.id }));
    });
  });

  describe('Tenant owner managing user-shop assignments', () => {
    let targetUserId: number;
    let createdUserShopId: number;

    beforeAll(async () => {
      const targetUser = await ctx.getSystemClient().users.create({
        email: `us-target-${generateUniqueId()}@example.com`,
        name: 'Target User',
      });
      targetUserId = targetUser.id;
    });

    afterAll(async () => {
      if (targetUserId) await cleanupUser(app, targetUserId);
    });

    it('should list user-shop assignments by shopId', async () => {
      const userShops = await ctx.client.userShops.getAll({ shopId: ctx.shop.id });

      expect(Array.isArray(userShops)).toBe(true);
    });

    it('should list user-shop assignments by tenantId', async () => {
      const userShops = await ctx.client.userShops.getAll({ tenantId: ctx.tenant.id });

      expect(Array.isArray(userShops)).toBe(true);
    });

    it('should assign user to shop', async () => {
      const userShop = await ctx.client.userShops.create({
        userId: targetUserId,
        shopId: ctx.shop.id,
      });

      expect(userShop).toHaveProperty('id');
      expect(userShop.userId).toBe(targetUserId);
      expect(userShop.shopId).toBe(ctx.shop.id);
      createdUserShopId = userShop.id;
    });

    it('should get user-shop by id', async () => {
      const userShop = await ctx.client.userShops.getById(createdUserShopId);

      expect(userShop.id).toBe(createdUserShopId);
      expect(userShop.userId).toBe(targetUserId);
      expect(userShop.shopId).toBe(ctx.shop.id);
    });

    it('should remove user from shop', async () => {
      await ctx.client.userShops.delete(createdUserShopId);

      await expectNotFound(() => ctx.client.userShops.getById(createdUserShopId));
    });
  });

  describe('Cross-tenant access control', () => {
    let targetUserId: number;
    let crossTenantUserShopId: number;

    beforeAll(async () => {
      // Create a user in ctx2's tenant
      const targetUser = await ctx2.getSystemClient().users.create({
        email: `us-cross-${generateUniqueId()}@example.com`,
        name: 'Cross Tenant Target',
      });
      targetUserId = targetUser.id;

      // Assign user to ctx2's shop
      const userShop = await ctx2.client.userShops.create({
        userId: targetUserId,
        shopId: ctx2.shop.id,
      });
      crossTenantUserShopId = userShop.id;
    });

    afterAll(async () => {
      if (targetUserId) await cleanupUser(app, targetUserId);
    });

    it('should not list user-shops from another tenant by shopId', async () => {
      await expectForbidden(() => ctx.client.userShops.getAll({ shopId: ctx2.shop.id }));
    });

    it('should not list user-shops from another tenant by tenantId', async () => {
      await expectForbidden(() => ctx.client.userShops.getAll({ tenantId: ctx2.tenant.id }));
    });

    it('should not get user-shop from another tenant', async () => {
      await expectForbidden(() => ctx.client.userShops.getById(crossTenantUserShopId));
    });

    it('should not create user-shop in another tenants shop', async () => {
      await expectForbidden(() =>
        ctx.client.userShops.create({
          userId: targetUserId,
          shopId: ctx2.shop.id,
        }),
      );
    });

    it('should not delete user-shop from another tenant', async () => {
      await expectForbidden(() => ctx.client.userShops.delete(crossTenantUserShopId));
    });
  });

  describe('System admin access', () => {
    let targetUserId: number;
    let adminCreatedUserShopId: number;

    beforeAll(async () => {
      const targetUser = await ctx.getSystemClient().users.create({
        email: `us-admin-${generateUniqueId()}@example.com`,
        name: 'Admin Target User',
      });
      targetUserId = targetUser.id;
    });

    afterAll(async () => {
      if (targetUserId) await cleanupUser(app, targetUserId);
    });

    it('should list all user-shops', async () => {
      const userShops = await ctx.getSystemClient().userShops.getAll();

      expect(Array.isArray(userShops)).toBe(true);
    });

    it('should create user-shop in any tenant', async () => {
      const userShop = await ctx.getSystemClient().userShops.create({
        userId: targetUserId,
        shopId: ctx.shop.id,
      });

      expect(userShop).toHaveProperty('id');
      expect(userShop.userId).toBe(targetUserId);
      adminCreatedUserShopId = userShop.id;
    });

    it('should get any user-shop by id', async () => {
      const userShop = await ctx.getSystemClient().userShops.getById(adminCreatedUserShopId);

      expect(userShop.id).toBe(adminCreatedUserShopId);
    });

    it('should delete any user-shop', async () => {
      await ctx.getSystemClient().userShops.delete(adminCreatedUserShopId);

      await expectNotFound(() => ctx.getSystemClient().userShops.getById(adminCreatedUserShopId));
    });
  });
});
