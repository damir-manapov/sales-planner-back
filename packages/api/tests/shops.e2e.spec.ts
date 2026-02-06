import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ROLE_NAMES } from '../src/common/constants.js';
import { TestContext } from './test-context.js';
import {
  cleanupUser,
  expectForbidden,
  expectNotFound,
  expectUnauthorized,
  generateTestCode,
  generateTestPeriod,
  generateUniqueId,
} from './test-helpers.js';

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
      tenantTitle: `Shops Test Tenant ${generateUniqueId()}`,
      userEmail: `shops-test-${generateUniqueId()}@example.com`,
      userName: 'Shops Test User',
    });

    // Delete initial shop (we'll create our own)
    await ctx.client.shops.deleteShop(ctx.shop.id);
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.shops.getShops());
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.shops.getShops());
    });
  });

  describe('Shop CRUD', () => {
    it('POST /shops - tenant owner should create shop', async () => {
      const shop = await ctx.client.shops.createShop({
        title: 'Test Shop',
        tenant_id: ctx.tenant.id,
      });

      expect(shop.title).toBe('Test Shop');
      expect(shop.tenant_id).toBe(ctx.tenant.id);
      testShopId = shop.id;
    });

    it('GET /shops - tenant owner should list shops', async () => {
      const shops = await ctx.client.shops.getShops();

      expect(Array.isArray(shops)).toBe(true);
      expect(shops.some((s) => s.id === testShopId)).toBe(true);
    });

    it('GET /shops?tenantId=X - should filter by tenant', async () => {
      const shops = await ctx.client.shops.getShops(ctx.tenant.id);

      expect(shops.every((s) => s.tenant_id === ctx.tenant.id)).toBe(true);
    });

    it('GET /shops/:id - should return shop by id', async () => {
      const shop = await ctx.client.shops.getShop(testShopId);

      expect(shop.id).toBe(testShopId);
      expect(shop.title).toBe('Test Shop');
    });

    it('PUT /shops/:id - tenant owner should update shop', async () => {
      const shop = await ctx.client.shops.updateShop(testShopId, { title: 'Updated Shop' });

      expect(shop.title).toBe('Updated Shop');
    });

    it('GET /shops/:id - should return 404 for non-existent shop', async () => {
      await expectNotFound(() => ctx.client.shops.getShop(999999));
    });
  });

  describe('Tenant Admin access', () => {
    let tenantAdminClient: SalesPlannerClient;
    let tenantAdminUserId: number;
    let adminCreatedShopId: number;

    beforeAll(async () => {
      // Create tenant admin user
      const adminUser = await ctx.getSystemClient().users.createUser({
        email: `tenant-admin-${generateUniqueId()}@example.com`,
        name: 'Tenant Admin User',
      });
      tenantAdminUserId = adminUser.id;
      const adminApiKey = await ctx.getSystemClient().apiKeys.createApiKey({
        user_id: tenantAdminUserId,
        name: 'Admin Key',
      });

      // Get tenantAdmin role and assign it
      const roles = await ctx.getSystemClient().roles.getRoles();
      const tenantAdminRole = roles.find((r) => r.name === ROLE_NAMES.TENANT_ADMIN);
      if (!tenantAdminRole) throw new Error('Tenant Admin role not found');
      await ctx.getSystemClient().userRoles.createUserRole({
        user_id: tenantAdminUserId,
        role_id: tenantAdminRole.id,
        tenant_id: ctx.tenant.id,
      });

      tenantAdminClient = new SalesPlannerClient({ baseUrl, apiKey: adminApiKey.key });
    });

    afterAll(async () => {
      if (tenantAdminUserId) {
        await cleanupUser(app, tenantAdminUserId);
      }
    });

    it('GET /shops - tenant admin should list shops in their tenant', async () => {
      const shops = await tenantAdminClient.shops.getShops();

      expect(Array.isArray(shops)).toBe(true);
    });

    it('POST /shops - tenant admin should create shop', async () => {
      const shop = await tenantAdminClient.shops.createShop({
        title: 'Admin Created Shop',
        tenant_id: ctx.tenant.id,
      });

      expect(shop.title).toBe('Admin Created Shop');
      adminCreatedShopId = shop.id;
    });

    it('PUT /shops/:id - tenant admin should update shop', async () => {
      const shop = await tenantAdminClient.shops.updateShop(adminCreatedShopId, {
        title: 'Admin Updated Shop',
      });

      expect(shop.title).toBe('Admin Updated Shop');
    });

    it('DELETE /shops/:id - tenant admin should delete shop', async () => {
      await tenantAdminClient.shops.deleteShop(adminCreatedShopId);
    });
  });

  describe('Cross-tenant access control', () => {
    let otherClient: SalesPlannerClient;
    let otherUserId: number;

    beforeAll(async () => {
      // Create another user with their own tenant
      const otherSetup = await ctx.getSystemClient().tenants.createTenantWithShopAndUser({
        tenantTitle: `Other Tenant ${generateUniqueId()}`,
        userEmail: `other-user-${generateUniqueId()}@example.com`,
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
      await expectForbidden(() => otherClient.shops.getShop(testShopId));
    });

    it('GET /shops?tenantId=X - should return 403 for other tenant', async () => {
      await expectForbidden(() => otherClient.shops.getShops(ctx.tenant.id));
    });

    it('POST /shops - should return 403 when creating shop in other tenant', async () => {
      await expectForbidden(() =>
        otherClient.shops.createShop({ title: 'Unauthorized Shop', tenant_id: ctx.tenant.id }),
      );
    });

    it('PUT /shops/:id - should return 403 when updating shop in other tenant', async () => {
      await expectForbidden(() =>
        otherClient.shops.updateShop(testShopId, { title: 'Hacked Shop' }),
      );
    });

    it('DELETE /shops/:id - should return 403 when deleting shop in other tenant', async () => {
      await expectForbidden(() => otherClient.shops.deleteShop(testShopId));
    });
  });

  describe('Delete shop data', () => {
    let dataShopId: number;
    const dataShopContext = () => ({ shop_id: dataShopId, tenant_id: ctx.tenant.id });

    beforeAll(async () => {
      // Create a shop with data
      const shop = await ctx.client.shops.createShop({
        title: `Data Shop ${generateUniqueId()}`,
        tenant_id: ctx.tenant.id,
      });
      dataShopId = shop.id;

      // Import some SKUs
      const sku1Code = generateTestCode('DATA-SKU-1');
      const sku2Code = generateTestCode('DATA-SKU-2');
      const marketplace1 = generateTestCode('WB');
      const marketplace2 = generateTestCode('OZON');
      const testPeriod = generateTestPeriod();

      await ctx.client.skus.importJson(dataShopContext(), [
        { code: sku1Code, title: 'Test SKU 1' },
        { code: sku2Code, title: 'Test SKU 2' },
      ]);

      // Import sales history
      await ctx.client.salesHistory.importJson(dataShopContext(), [
        { marketplace: marketplace1, period: testPeriod, sku: sku1Code, quantity: 100 },
        { marketplace: marketplace2, period: testPeriod, sku: sku2Code, quantity: 200 },
      ]);
    });

    it('DELETE /shops/:id/data - should delete shop data', async () => {
      const result = await ctx.client.shops.deleteShopData(dataShopId);

      expect(result.skusDeleted).toBe(2);
      expect(result.salesHistoryDeleted).toBe(2);
    });

    it('GET /skus - should return empty after data deletion', async () => {
      const { items: skus } = await ctx.client.skus.getSkus(dataShopContext());

      expect(skus).toHaveLength(0);
    });
  });

  describe('System admin access', () => {
    it('GET /shops - system admin should see all shops', async () => {
      const shops = await ctx.getSystemClient().shops.getShops();

      expect(Array.isArray(shops)).toBe(true);
    });

    it('GET /shops/:id - system admin should access any shop', async () => {
      const shop = await ctx.getSystemClient().shops.getShop(testShopId);

      expect(shop.id).toBe(testShopId);
    });
  });

  describe('Role-based access', () => {
    describe('Editor role', () => {
      let editorUserId: number;
      let editorClient: SalesPlannerClient;

      beforeAll(async () => {
        const editorUser = await ctx.getSystemClient().users.createUser({
          email: `editor-${generateUniqueId()}@example.com`,
          name: 'Editor User',
        });
        editorUserId = editorUser.id;

        const editorApiKey = await ctx.getSystemClient().apiKeys.createApiKey({
          user_id: editorUserId,
          name: 'Editor Key',
        });
        editorClient = new SalesPlannerClient({ baseUrl, apiKey: editorApiKey.key });

        const roles = await ctx.getSystemClient().roles.getRoles();
        const editorRole = roles.find((r) => r.name === ROLE_NAMES.EDITOR);
        if (!editorRole) throw new Error('Editor role not found');
        await ctx.getSystemClient().userRoles.createUserRole({
          user_id: editorUserId,
          role_id: editorRole.id,
          tenant_id: ctx.tenant.id,
          shop_id: testShopId,
        });
      });

      afterAll(async () => {
        if (editorUserId) await cleanupUser(app, editorUserId);
      });

      it('editor should list shops', async () => {
        const shops = await editorClient.shops.getShops();
        expect(Array.isArray(shops)).toBe(true);
        expect(shops.some((s) => s.id === testShopId)).toBe(true);
      });

      it('editor should get shop by id', async () => {
        const shop = await editorClient.shops.getShop(testShopId);
        expect(shop.id).toBe(testShopId);
      });

      it('editor should NOT create shop', async () => {
        await expectForbidden(() =>
          editorClient.shops.createShop({ title: 'Editor Shop', tenant_id: ctx.tenant.id }),
        );
      });

      it('editor should NOT update shop', async () => {
        await expectForbidden(() =>
          editorClient.shops.updateShop(testShopId, { title: 'Editor Updated' }),
        );
      });

      it('editor should NOT delete shop', async () => {
        await expectForbidden(() => editorClient.shops.deleteShop(testShopId));
      });
    });

    describe('Viewer role', () => {
      let viewerUserId: number;
      let viewerClient: SalesPlannerClient;

      beforeAll(async () => {
        const viewerUser = await ctx.getSystemClient().users.createUser({
          email: `viewer-${generateUniqueId()}@example.com`,
          name: 'Viewer User',
        });
        viewerUserId = viewerUser.id;

        const viewerApiKey = await ctx.getSystemClient().apiKeys.createApiKey({
          user_id: viewerUserId,
          name: 'Viewer Key',
        });
        viewerClient = new SalesPlannerClient({ baseUrl, apiKey: viewerApiKey.key });

        const roles = await ctx.getSystemClient().roles.getRoles();
        const viewerRole = roles.find((r) => r.name === ROLE_NAMES.VIEWER);
        if (!viewerRole) throw new Error('Viewer role not found');
        await ctx.getSystemClient().userRoles.createUserRole({
          user_id: viewerUserId,
          role_id: viewerRole.id,
          tenant_id: ctx.tenant.id,
          shop_id: testShopId,
        });
      });

      afterAll(async () => {
        if (viewerUserId) await cleanupUser(app, viewerUserId);
      });

      it('viewer should list shops', async () => {
        const shops = await viewerClient.shops.getShops();
        expect(Array.isArray(shops)).toBe(true);
        expect(shops.some((s) => s.id === testShopId)).toBe(true);
      });

      it('viewer should get shop by id', async () => {
        const shop = await viewerClient.shops.getShop(testShopId);
        expect(shop.id).toBe(testShopId);
      });

      it('viewer should NOT create shop', async () => {
        await expectForbidden(() =>
          viewerClient.shops.createShop({ title: 'Viewer Shop', tenant_id: ctx.tenant.id }),
        );
      });

      it('viewer should NOT update shop', async () => {
        await expectForbidden(() =>
          viewerClient.shops.updateShop(testShopId, { title: 'Viewer Updated' }),
        );
      });

      it('viewer should NOT delete shop', async () => {
        await expectForbidden(() => viewerClient.shops.deleteShop(testShopId));
      });
    });
  });

  describe('Shop deletion', () => {
    it('DELETE /shops/:id - tenant owner should delete shop', async () => {
      await ctx.client.shops.deleteShop(testShopId);
    });

    it('GET /shops/:id - should return 404 after deletion', async () => {
      await expectNotFound(() => ctx.client.shops.getShop(testShopId));
    });
  });
});
