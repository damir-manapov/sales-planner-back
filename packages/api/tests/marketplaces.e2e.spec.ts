import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { SalesPlannerClient, ApiError } from '@sales-planner/http-client';
import { cleanupUser, SYSTEM_ADMIN_KEY } from './test-helpers.js';

describe('Marketplaces (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let client: SalesPlannerClient;
  let systemClient: SalesPlannerClient;
  let tenantId: number;
  let shopId: number;
  let testUserId: number;

  const ctx = () => ({ shop_id: shopId, tenant_id: tenantId });

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

    // Create tenant with shop and user in one call
    const setup = await systemClient.createTenantWithShopAndUser({
      tenantTitle: `Test Tenant ${Date.now()}`,
      userEmail: `mp-test-${Date.now()}@example.com`,
      userName: 'Marketplace Test User',
    });

    testUserId = setup.user.id;
    tenantId = setup.tenant.id;
    shopId = setup.shop.id;

    client = new SalesPlannerClient({
      baseUrl,
      apiKey: setup.apiKey,
    });
  });

  afterAll(async () => {
    if (testUserId) {
      await cleanupUser(app, testUserId);
    }
    await app.close();
  });

  describe('GET /marketplaces', () => {
    it('should list marketplaces for the shop', async () => {
      const marketplaces = await client.getMarketplaces(ctx());
      expect(Array.isArray(marketplaces)).toBe(true);
      // Should only return marketplaces for this shop
      marketplaces.forEach((mp) => {
        expect(mp.shop_id).toBe(shopId);
        expect(mp.tenant_id).toBe(tenantId);
      });
    });
  });

  describe('POST /marketplaces', () => {
    const testMarketplaceId = `MP-CREATE-${Date.now()}`;

    it("should create marketplace in the user's shop", async () => {
      const marketplace = await client.createMarketplace(
        { id: testMarketplaceId, title: 'Test Marketplace' },
        ctx(),
      );
      expect(marketplace.id).toBe(testMarketplaceId);
      expect(marketplace.title).toBe('Test Marketplace');
      expect(marketplace.shop_id).toBe(shopId);
      expect(marketplace.tenant_id).toBe(tenantId);
    });

    it('should return 409 on duplicate marketplace code in same shop', async () => {
      try {
        await client.createMarketplace({ id: testMarketplaceId, title: 'Duplicate' }, ctx());
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(409);
      }
    });
  });

  describe('GET /marketplaces/:id', () => {
    const testMarketplaceId = `MP-GET-${Date.now()}`;

    beforeAll(async () => {
      await client.createMarketplace({ id: testMarketplaceId, title: 'Test' }, ctx());
    });

    it('should get marketplace by id', async () => {
      const marketplace = await client.getMarketplace(testMarketplaceId, ctx());
      expect(marketplace.id).toBe(testMarketplaceId);
      expect(marketplace.shop_id).toBe(shopId);
    });

    it('should return 404 for non-existent marketplace', async () => {
      try {
        await client.getMarketplace('NON-EXISTENT', ctx());
        expect.fail('Should have thrown 404');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(404);
      }
    });
  });

  describe('PUT /marketplaces/:id', () => {
    const testMarketplaceId = `MP-UPDATE-${Date.now()}`;

    beforeAll(async () => {
      await client.createMarketplace({ id: testMarketplaceId, title: 'Original' }, ctx());
    });

    it('should update marketplace', async () => {
      const marketplace = await client.updateMarketplace(
        testMarketplaceId,
        { title: 'Updated Title' },
        ctx(),
      );
      expect(marketplace.title).toBe('Updated Title');
      expect(marketplace.shop_id).toBe(shopId);
    });

    it('should return 404 for non-existent marketplace', async () => {
      try {
        await client.updateMarketplace('NON-EXISTENT', { title: 'Updated' }, ctx());
        expect.fail('Should have thrown 404');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(404);
      }
    });
  });

  describe('DELETE /marketplaces/:id', () => {
    const testMarketplaceId = `MP-DELETE-${Date.now()}`;

    beforeAll(async () => {
      await client.createMarketplace({ id: testMarketplaceId, title: 'To Delete' }, ctx());
    });

    it('should delete marketplace', async () => {
      await client.deleteMarketplace(testMarketplaceId, ctx());

      // Verify it's deleted
      try {
        await client.getMarketplace(testMarketplaceId, ctx());
        expect.fail('Should have thrown 404');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(404);
      }
    });
  });

  describe('Shop isolation', () => {
    let otherShopId: number;
    let otherTenantId: number;
    let otherUserId: number;
    let otherClient: SalesPlannerClient;
    const isolatedMarketplaceId = `MP-ISOLATED-${Date.now()}`;

    beforeAll(async () => {
      // Create another tenant/shop/user
      const setup = await systemClient.createTenantWithShopAndUser({
        tenantTitle: `Other Tenant ${Date.now()}`,
        userEmail: `mp-other-${Date.now()}@example.com`,
        userName: 'Other User',
      });

      otherUserId = setup.user.id;
      otherShopId = setup.shop.id;
      otherTenantId = setup.tenant.id;
      otherClient = new SalesPlannerClient({ baseUrl, apiKey: setup.apiKey });

      // Create marketplace in first shop
      await client.createMarketplace({ id: isolatedMarketplaceId, title: 'Isolated' }, ctx());
    });

    afterAll(async () => {
      if (otherUserId) {
        await cleanupUser(app, otherUserId);
      }
    });

    it('should not see marketplaces from other shops', async () => {
      const marketplaces = await otherClient.getMarketplaces({
        shop_id: otherShopId,
        tenant_id: otherTenantId,
      });
      const found = marketplaces.find((m) => m.id === isolatedMarketplaceId);
      expect(found).toBeUndefined();
    });

    it('should not access marketplace from other shop', async () => {
      try {
        await otherClient.getMarketplace(isolatedMarketplaceId, {
          shop_id: otherShopId,
          tenant_id: otherTenantId,
        });
        expect.fail('Should have thrown 404');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(404);
      }
    });

    it('should allow same marketplace code in different shops', async () => {
      const marketplace = await otherClient.createMarketplace(
        { id: isolatedMarketplaceId, title: 'Same Code Different Shop' },
        { shop_id: otherShopId, tenant_id: otherTenantId },
      );
      expect(marketplace.id).toBe(isolatedMarketplaceId);
      expect(marketplace.shop_id).toBe(otherShopId);
    });
  });
});
