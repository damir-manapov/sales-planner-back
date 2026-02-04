import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { SalesPlannerClient, ApiError } from '@sales-planner/http-client';
import { cleanupUser, SYSTEM_ADMIN_KEY } from './test-helpers.js';

describe('Marketplaces (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let systemClient: SalesPlannerClient;
  let regularUserClient: SalesPlannerClient;
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

    // Create a regular test user (not system admin)
    const testUser = await systemClient.createUser({
      email: `mp-test-${Date.now()}@example.com`,
      name: 'Marketplace Test User',
    });
    testUserId = testUser.id;
    const testUserKey = `mp-test-key-${Date.now()}`;
    await systemClient.createApiKey({ user_id: testUserId, key: testUserKey, name: 'Test Key' });

    regularUserClient = new SalesPlannerClient({ baseUrl, apiKey: testUserKey });
  });

  afterAll(async () => {
    if (testUserId) {
      await cleanupUser(app, testUserId);
    }
    await app.close();
  });

  describe('GET /marketplaces', () => {
    it('should allow regular user to list marketplaces', async () => {
      const marketplaces = await regularUserClient.getMarketplaces();
      expect(Array.isArray(marketplaces)).toBe(true);
    });
  });

  describe('POST /marketplaces', () => {
    const testMarketplaceId = `MP-CREATE-${Date.now()}`;

    afterAll(async () => {
      // Cleanup - ignore if not created
      try {
        await systemClient.deleteMarketplace(testMarketplaceId);
      } catch {
        // ignore
      }
    });

    it('should return 403 for regular user', async () => {
      try {
        await regularUserClient.createMarketplace({ id: testMarketplaceId, title: 'Test' });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(403);
      }
    });

    it('should allow system admin to create marketplace', async () => {
      const marketplace = await systemClient.createMarketplace({
        id: testMarketplaceId,
        title: 'Test Marketplace',
      });
      expect(marketplace.id).toBe(testMarketplaceId);
      expect(marketplace.title).toBe('Test Marketplace');
    });
  });

  describe('PUT /marketplaces/:id', () => {
    const testMarketplaceId = `MP-UPDATE-${Date.now()}`;

    beforeAll(async () => {
      await systemClient.createMarketplace({ id: testMarketplaceId, title: 'Original' });
    });

    afterAll(async () => {
      await systemClient.deleteMarketplace(testMarketplaceId);
    });

    it('should return 403 for regular user', async () => {
      try {
        await regularUserClient.updateMarketplace(testMarketplaceId, { title: 'Updated' });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(403);
      }
    });

    it('should allow system admin to update marketplace', async () => {
      const marketplace = await systemClient.updateMarketplace(testMarketplaceId, {
        title: 'Updated Title',
      });
      expect(marketplace.title).toBe('Updated Title');
    });
  });

  describe('DELETE /marketplaces/:id', () => {
    const testMarketplaceId = `MP-DELETE-${Date.now()}`;

    beforeAll(async () => {
      await systemClient.createMarketplace({ id: testMarketplaceId, title: 'To Delete' });
    });

    it('should return 403 for regular user', async () => {
      try {
        await regularUserClient.deleteMarketplace(testMarketplaceId);
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(403);
      }
    });

    it('should allow system admin to delete marketplace', async () => {
      await systemClient.deleteMarketplace(testMarketplaceId);

      // Verify it's deleted
      try {
        await systemClient.getMarketplace(testMarketplaceId);
        expect.fail('Should have thrown 404');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(404);
      }
    });
  });
});
