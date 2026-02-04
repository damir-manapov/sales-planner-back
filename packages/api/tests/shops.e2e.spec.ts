import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ApiError, SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { TestContext } from './test-context.js';
import { cleanupUser } from './test-helpers.js';

describe('Shops E2E', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let testShopId: number;

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
      tenantTitle: `Shops Test Tenant ${Date.now()}`,
      userEmail: `shops-test-${Date.now()}@example.com`,
      userName: 'Shops Test User',
    });

    // Delete initial shop (we'll create our own)
    await ctx.client.deleteShop(ctx.shop.id);
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Shop CRUD', () => {
    it('POST /shops - tenant owner should create shop', async () => {
      const shop = await ctx.client.createShop({ title: 'Test Shop', tenant_id: ctx.tenant.id });

      expect(shop.title).toBe('Test Shop');
      expect(shop.tenant_id).toBe(ctx.tenant.id);
      testShopId = shop.id;
    });

    it('GET /shops - tenant owner should list shops', async () => {
      const shops = await ctx.client.getShops();

      expect(Array.isArray(shops)).toBe(true);
      expect(shops.some((s) => s.id === testShopId)).toBe(true);
    });

    it('GET /shops?tenantId=X - should filter by tenant', async () => {
      const shops = await ctx.client.getShops(ctx.tenant.id);

      expect(shops.every((s) => s.tenant_id === ctx.tenant.id)).toBe(true);
    });

    it('GET /shops/:id - should return shop by id', async () => {
      const shop = await ctx.client.getShop(testShopId);

      expect(shop.id).toBe(testShopId);
      expect(shop.title).toBe('Test Shop');
    });

    it('PUT /shops/:id - tenant owner should update shop', async () => {
      const shop = await ctx.client.updateShop(testShopId, { title: 'Updated Shop' });

      expect(shop.title).toBe('Updated Shop');
    });

    it('GET /shops/:id - should return 404 for non-existent shop', async () => {
      try {
        await ctx.client.getShop(999999);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }
    });
  });

  describe('Tenant Admin access', () => {
    let tenantAdminClient: SalesPlannerClient;
    let tenantAdminUserId: number;
    let adminCreatedShopId: number;

    beforeAll(async () => {
      // Create tenant admin user
      const adminUser = await ctx.getSystemClient().createUser({
        email: `tenant-admin-${Date.now()}@example.com`,
        name: 'Tenant Admin User',
      });
      tenantAdminUserId = adminUser.id;
      const adminApiKey = await ctx.getSystemClient().createApiKey({
        user_id: tenantAdminUserId,
        name: 'Admin Key',
      });

      // Get tenantAdmin role and assign it
      const roles = await ctx.getSystemClient().getRoles();
      const tenantAdminRole = roles.find((r) => r.name === 'tenantAdmin');
      if (tenantAdminRole) {
        await ctx.getSystemClient().createUserRole({
          user_id: tenantAdminUserId,
          role_id: tenantAdminRole.id,
          tenant_id: ctx.tenant.id,
        });
      }

      tenantAdminClient = new SalesPlannerClient({ baseUrl, apiKey: adminApiKey.key });
    });

    afterAll(async () => {
      if (tenantAdminUserId) {
        await cleanupUser(app, tenantAdminUserId);
      }
    });

    it('GET /shops - tenant admin should list shops in their tenant', async () => {
      const shops = await tenantAdminClient.getShops();

      expect(Array.isArray(shops)).toBe(true);
    });

    it('POST /shops - tenant admin should create shop', async () => {
      const shop = await tenantAdminClient.createShop({
        title: 'Admin Created Shop',
        tenant_id: ctx.tenant.id,
      });

      expect(shop.title).toBe('Admin Created Shop');
      adminCreatedShopId = shop.id;
    });

    it('PUT /shops/:id - tenant admin should update shop', async () => {
      const shop = await tenantAdminClient.updateShop(adminCreatedShopId, {
        title: 'Admin Updated Shop',
      });

      expect(shop.title).toBe('Admin Updated Shop');
    });

    it('DELETE /shops/:id - tenant admin should delete shop', async () => {
      await tenantAdminClient.deleteShop(adminCreatedShopId);
    });
  });

  describe('Cross-tenant access control', () => {
    let otherClient: SalesPlannerClient;
    let otherUserId: number;

    beforeAll(async () => {
      // Create another user with their own tenant
      const otherSetup = await ctx.getSystemClient().createTenantWithShopAndUser({
        tenantTitle: `Other Tenant ${Date.now()}`,
        userEmail: `other-user-${Date.now()}@example.com`,
        userName: 'Other User',
      });

      otherUserId = otherSetup.user.id;
      otherClient = new SalesPlannerClient({ baseUrl, apiKey: otherSetup.apiKey });
    });

    afterAll(async () => {
      if (otherUserId) {
        await cleanupUser(app, otherUserId);
      }
    });

    it('GET /shops/:id - should return 403 for shop in other tenant', async () => {
      try {
        await otherClient.getShop(testShopId);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });

    it('GET /shops?tenantId=X - should return 403 for other tenant', async () => {
      try {
        await otherClient.getShops(ctx.tenant.id);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });

    it('POST /shops - should return 403 when creating shop in other tenant', async () => {
      try {
        await otherClient.createShop({ title: 'Unauthorized Shop', tenant_id: ctx.tenant.id });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });

    it('PUT /shops/:id - should return 403 when updating shop in other tenant', async () => {
      try {
        await otherClient.updateShop(testShopId, { title: 'Hacked Shop' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });

    it('DELETE /shops/:id - should return 403 when deleting shop in other tenant', async () => {
      try {
        await otherClient.deleteShop(testShopId);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });
  });

  describe('Delete shop data', () => {
    let dataShopId: number;
    const dataShopContext = () => ({ shop_id: dataShopId, tenant_id: ctx.tenant.id });

    beforeAll(async () => {
      // Create a shop with data
      const shop = await ctx.client.createShop({
        title: `Data Shop ${Date.now()}`,
        tenant_id: ctx.tenant.id,
      });
      dataShopId = shop.id;

      // Import some SKUs
      await ctx.client.importSkusJson(
        [
          { code: 'DATA-SKU-1', title: 'Test SKU 1' },
          { code: 'DATA-SKU-2', title: 'Test SKU 2' },
        ],
        dataShopContext(),
      );

      // Import sales history
      await ctx.client.importSalesHistoryJson(
        [
          { sku_code: 'DATA-SKU-1', period: '2025-01', quantity: 100, marketplace: 'WB' },
          { sku_code: 'DATA-SKU-2', period: '2025-01', quantity: 200, marketplace: 'OZON' },
        ],
        dataShopContext(),
      );
    });

    it('DELETE /shops/:id/data - should delete shop data', async () => {
      const result = await ctx.client.deleteShopData(dataShopId);

      expect(result.skusDeleted).toBe(2);
      expect(result.salesHistoryDeleted).toBe(2);
    });

    it('GET /skus - should return empty after data deletion', async () => {
      const skus = await ctx.client.getSkus(dataShopContext());

      expect(skus).toHaveLength(0);
    });
  });

  describe('System admin access', () => {
    it('GET /shops - system admin should see all shops', async () => {
      const shops = await ctx.getSystemClient().getShops();

      expect(Array.isArray(shops)).toBe(true);
    });

    it('GET /shops/:id - system admin should access any shop', async () => {
      const shop = await ctx.getSystemClient().getShop(testShopId);

      expect(shop.id).toBe(testShopId);
    });
  });

  describe('Shop deletion', () => {
    it('DELETE /shops/:id - tenant owner should delete shop', async () => {
      await ctx.client.deleteShop(testShopId);
    });

    it('GET /shops/:id - should return 404 after deletion', async () => {
      try {
        await ctx.client.getShop(testShopId);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }
    });
  });
});
