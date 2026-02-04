import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { SalesPlannerClient, ApiError } from '@sales-planner/http-client';
import { cleanupUser, SYSTEM_ADMIN_KEY } from './test-helpers.js';

describe('Shops E2E', () => {
  let app: INestApplication;
  let baseUrl: string;
  let systemClient: SalesPlannerClient;
  let client: SalesPlannerClient;

  // Test data
  let testUserId: number;
  let testTenantId: number;
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

    systemClient = new SalesPlannerClient({
      baseUrl,
      apiKey: SYSTEM_ADMIN_KEY,
    });

    // Create test user and tenant
    const setup = await systemClient.createTenantWithShopAndUser({
      tenantTitle: `Shops Test Tenant ${Date.now()}`,
      userEmail: `shops-test-${Date.now()}@example.com`,
      userName: 'Shops Test User',
    });

    testUserId = setup.user.id;
    testTenantId = setup.tenant.id;

    client = new SalesPlannerClient({
      baseUrl,
      apiKey: setup.apiKey,
    });

    // Delete initial shop (we'll create our own)
    await client.deleteShop(setup.shop.id);
  });

  afterAll(async () => {
    if (testUserId) {
      await cleanupUser(app, testUserId);
    }
    await app.close();
  });

  describe('Shop CRUD', () => {
    it('POST /shops - tenant owner should create shop', async () => {
      const shop = await client.createShop({ title: 'Test Shop', tenant_id: testTenantId });

      expect(shop.title).toBe('Test Shop');
      expect(shop.tenant_id).toBe(testTenantId);
      testShopId = shop.id;
    });

    it('GET /shops - tenant owner should list shops', async () => {
      const shops = await client.getShops();

      expect(Array.isArray(shops)).toBe(true);
      expect(shops.some((s) => s.id === testShopId)).toBe(true);
    });

    it('GET /shops?tenantId=X - should filter by tenant', async () => {
      const shops = await client.getShops(testTenantId);

      expect(shops.every((s) => s.tenant_id === testTenantId)).toBe(true);
    });

    it('GET /shops/:id - should return shop by id', async () => {
      const shop = await client.getShop(testShopId);

      expect(shop.id).toBe(testShopId);
      expect(shop.title).toBe('Test Shop');
    });

    it('PUT /shops/:id - tenant owner should update shop', async () => {
      const shop = await client.updateShop(testShopId, { title: 'Updated Shop' });

      expect(shop.title).toBe('Updated Shop');
    });

    it('GET /shops/:id - should return 404 for non-existent shop', async () => {
      try {
        await client.getShop(999999);
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
      const adminUser = await systemClient.createUser({
        email: `tenant-admin-${Date.now()}@example.com`,
        name: 'Tenant Admin User',
      });
      tenantAdminUserId = adminUser.id;
      const adminApiKey = await systemClient.createApiKey({
        user_id: tenantAdminUserId,
        name: 'Admin Key',
      });

      // Get tenantAdmin role and assign it
      const roles = await systemClient.getRoles();
      const tenantAdminRole = roles.find((r) => r.name === 'tenantAdmin');
      if (tenantAdminRole) {
        await systemClient.createUserRole({
          user_id: tenantAdminUserId,
          role_id: tenantAdminRole.id,
          tenant_id: testTenantId,
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
        tenant_id: testTenantId,
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
      const otherSetup = await systemClient.createTenantWithShopAndUser({
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
        await otherClient.getShops(testTenantId);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });

    it('POST /shops - should return 403 when creating shop in other tenant', async () => {
      try {
        await otherClient.createShop({ title: 'Unauthorized Shop', tenant_id: testTenantId });
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
    const ctx = () => ({ shop_id: dataShopId, tenant_id: testTenantId });

    beforeAll(async () => {
      // Create a shop with data
      const shop = await client.createShop({
        title: `Data Shop ${Date.now()}`,
        tenant_id: testTenantId,
      });
      dataShopId = shop.id;

      // Import some SKUs
      await client.importSkusJson(
        [
          { code: 'DATA-SKU-1', title: 'Test SKU 1' },
          { code: 'DATA-SKU-2', title: 'Test SKU 2' },
        ],
        ctx(),
      );

      // Import sales history
      await client.importSalesHistoryJson(
        [
          { sku_code: 'DATA-SKU-1', period: '2025-01', quantity: 100, marketplace: 'WB' },
          { sku_code: 'DATA-SKU-2', period: '2025-01', quantity: 200, marketplace: 'OZON' },
        ],
        ctx(),
      );
    });

    it('DELETE /shops/:id/data - should delete shop data', async () => {
      const result = await client.deleteShopData(dataShopId);

      expect(result.skusDeleted).toBe(2);
      expect(result.salesHistoryDeleted).toBe(2);
    });

    it('GET /skus - should return empty after data deletion', async () => {
      const skus = await client.getSkus(ctx());

      expect(skus).toHaveLength(0);
    });
  });

  describe('System admin access', () => {
    it('GET /shops - system admin should see all shops', async () => {
      const shops = await systemClient.getShops();

      expect(Array.isArray(shops)).toBe(true);
    });

    it('GET /shops/:id - system admin should access any shop', async () => {
      const shop = await systemClient.getShop(testShopId);

      expect(shop.id).toBe(testShopId);
    });
  });

  describe('Shop deletion', () => {
    it('DELETE /shops/:id - tenant owner should delete shop', async () => {
      await client.deleteShop(testShopId);
    });

    it('GET /shops/:id - should return 404 after deletion', async () => {
      try {
        await client.getShop(testShopId);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }
    });
  });
});
