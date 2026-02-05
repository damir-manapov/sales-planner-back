import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError, SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { normalizeCode } from '../src/lib/normalize-code.js';
import { TestContext } from './test-context.js';
import { cleanupUser } from './test-helpers.js';

describe('Statuss (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let statusId: number;

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
      userEmail: `status-test-${Date.now()}@example.com`,
      userName: 'Status Test User',
    });
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });

      try {
        await noAuthClient.getStatuses(ctx.shopContext);
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });

      try {
        await badClient.getStatuses(ctx.shopContext);
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });
  });

  describe('CRUD operations', () => {
    it('createStatus - should create status', async () => {
      const newStatus = { code: `status-${Date.now()}`, title: 'Test Status' };
      const status = await ctx.client.createStatus(newStatus, ctx.shopContext);

      expect(status).toHaveProperty('id');
      expect(status.code).toBe(normalizeCode(newStatus.code));
      expect(status.title).toBe(newStatus.title);
      expect(status.shop_id).toBe(ctx.shop.id);
      expect(status.tenant_id).toBe(ctx.tenant.id);

      statusId = status.id;
    });

    it('getStatuses - should return statuses for shop and tenant', async () => {
      const statuses = await ctx.client.getStatuses(ctx.shopContext);

      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBeGreaterThan(0);
    });

    it('getStatus - should return status by id', async () => {
      const status = await ctx.client.getStatus(statusId, ctx.shopContext);

      expect(status.id).toBe(statusId);
    });

    it('updateStatus - should update status', async () => {
      const status = await ctx.client.updateStatus(
        statusId,
        { title: 'Updated Status Title' },
        ctx.shopContext,
      );

      expect(status.title).toBe('Updated Status Title');
    });

    it('createStatus - should return 409 on duplicate code in same shop', async () => {
      const duplicateCode = `status-${Date.now()}`;
      await ctx.client.createStatus({ code: duplicateCode, title: 'First Status' }, ctx.shopContext);

      try {
        await ctx.client.createStatus(
          { code: duplicateCode, title: 'Duplicate Status' },
          ctx.shopContext,
        );
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(409);
      }
    });
  });

  describe('Tenant-based access control', () => {
    it('should return 403 for wrong tenant', async () => {
      // Create another user with their own tenant
      const otherSetup = await ctx.getSystemClient().createTenantWithShopAndUser({
        tenantTitle: `Other Tenant ${Date.now()}`,
        userEmail: `other-${Date.now()}@example.com`,
        userName: 'Other User',
      });

      try {
        await ctx.client.getStatuses({
          shop_id: otherSetup.shop.id,
          tenant_id: otherSetup.tenant.id,
        });
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }

      await cleanupUser(app, otherSetup.user.id);
    });

    it('should return 403 when creating status for wrong tenant', async () => {
      const otherSetup = await ctx.getSystemClient().createTenantWithShopAndUser({
        tenantTitle: `Other Tenant ${Date.now()}`,
        userEmail: `other2-${Date.now()}@example.com`,
        userName: 'Other User 2',
      });

      try {
        await ctx.client.createStatus(
          { code: 'forbidden-status', title: 'Should Fail' },
          { shop_id: ctx.shop.id, tenant_id: otherSetup.tenant.id },
        );
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }

      await cleanupUser(app, otherSetup.user.id);
    });

    it('should return 404 for status in wrong tenant', async () => {
      const otherSetup = await ctx.getSystemClient().createTenantWithShopAndUser({
        tenantTitle: `Other Tenant ${Date.now()}`,
        userEmail: `other3-${Date.now()}@example.com`,
        userName: 'Other User 3',
      });

      // Give test user access to the other tenant
      const roles = await ctx.getSystemClient().getRoles();
      const tenantAdminRole = roles.find((r) => r.name === 'tenantAdmin');
      if (tenantAdminRole) {
        await ctx.getSystemClient().createUserRole({
          user_id: ctx.user.id,
          role_id: tenantAdminRole.id,
          tenant_id: otherSetup.tenant.id,
        });
      }

      try {
        await ctx.client.getStatus(statusId, {
          shop_id: otherSetup.shop.id,
          tenant_id: otherSetup.tenant.id,
        });
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }

      await cleanupUser(app, otherSetup.user.id);
    });
  });

  describe('Delete operations', () => {
    it('deleteStatus - should delete status', async () => {
      await ctx.client.deleteStatus(statusId, ctx.shopContext);

      try {
        await ctx.client.getStatus(statusId, ctx.shopContext);
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }

      statusId = 0;
    });
  });

  describe('Import endpoints', () => {
    it('importStatusesJson - should import statuses from JSON', async () => {
      const code1 = `import-json-1-${Date.now()}`;
      const code2 = `import-json-2-${Date.now()}`;
      const items = [
        { code: code1, title: 'Import JSON Status 1' },
        { code: code2, title: 'Import JSON Status 2' },
      ];

      const result = await ctx.client.importStatusesJson(items, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      const statuses = await ctx.client.getStatuses(ctx.shopContext);
      const codes = statuses.map((b) => b.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('importStatusesJson - should upsert existing statuses', async () => {
      const code = `upsert-json-${Date.now()}`;

      await ctx.client.importStatusesJson([{ code, title: 'Original Title' }], ctx.shopContext);
      const result = await ctx.client.importStatusesJson(
        [{ code, title: 'Updated Title' }],
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('importStatusesCsv - should import statuses from CSV with commas', async () => {
      const code1 = `import-csv-1-${Date.now()}`;
      const code2 = `import-csv-2-${Date.now()}`;
      const csvContent = `code,title\n${code1},Import CSV Status 1\n${code2},Import CSV Status 2`;

      const result = await ctx.client.importStatusesCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const statuses = await ctx.client.getStatuses(ctx.shopContext);
      const codes = statuses.map((b) => b.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('importStatusesCsv - should import statuses from CSV with semicolons', async () => {
      const code1 = `import-semi-1-${Date.now()}`;
      const code2 = `import-semi-2-${Date.now()}`;
      const csvContent = `code;title\n${code1};Import Semicolon Status 1\n${code2};Import Semicolon Status 2`;

      const result = await ctx.client.importStatusesCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const statuses = await ctx.client.getStatuses(ctx.shopContext);
      const codes = statuses.map((b) => b.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('importStatusesCsv - should handle Cyrillic characters with semicolons', async () => {
      const csvContent = `code;title\nmavyko;Мавико\nmarshall;MARSHALL\nmazda;Mazda`;

      const result = await ctx.client.importStatusesCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(3);
      expect(result.updated).toBe(0);

      const statuses = await ctx.client.getStatuses(ctx.shopContext);
      const mavyko = statuses.find((b) => b.code === 'mavyko');
      expect(mavyko).toBeDefined();
      expect(mavyko?.title).toBe('Мавико');
    });

    it('exportStatusesJson - should export statuses in import format', async () => {
      const code1 = `export-status-1-${Date.now()}`;
      const code2 = `export-status-2-${Date.now()}`;

      await ctx.client.importStatusesJson(
        [
          { code: code1, title: 'Export Test Status 1' },
          { code: code2, title: 'Export Test Status 2' },
        ],
        ctx.shopContext,
      );

      const exported = await ctx.client.exportStatusesJson(ctx.shopContext);

      expect(Array.isArray(exported)).toBe(true);
      const exportedCodes = exported.map((b) => b.code);
      expect(exportedCodes).toContain(normalizeCode(code1));
      expect(exportedCodes).toContain(normalizeCode(code2));

      const item = exported.find((b) => b.code === normalizeCode(code1));
      expect(item).toEqual({ code: normalizeCode(code1), title: 'Export Test Status 1' });
    });

    it('exportStatusesCsv - should export statuses in CSV format', async () => {
      const code1 = `csv-export-status-1-${Date.now()}`;
      const code2 = `csv-export-status-2-${Date.now()}`;

      await ctx.client.importStatusesJson(
        [
          { code: code1, title: 'CSV Export Test 1' },
          { code: code2, title: 'CSV Export Test 2' },
        ],
        ctx.shopContext,
      );

      const csv = await ctx.client.exportStatusesCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('code,title');
      expect(lines.some((line: string) => line.includes(normalizeCode(code1)))).toBe(true);
      expect(lines.some((line: string) => line.includes(normalizeCode(code2)))).toBe(true);
    });
  });

  describe('Viewer role access', () => {
    let viewerUserId: number;
    let viewerClient: SalesPlannerClient;

    beforeAll(async () => {
      // Create viewer user
      const viewerUser = await ctx.getSystemClient().createUser({
        email: `viewer-${Date.now()}@example.com`,
        name: 'Viewer User',
      });
      viewerUserId = viewerUser.id;
      const viewerApiKey = await ctx.getSystemClient().createApiKey({
        user_id: viewerUserId,
        name: 'Viewer Key',
      });

      viewerClient = new SalesPlannerClient({ baseUrl, apiKey: viewerApiKey.key });

      // Assign viewer role
      const roles = await ctx.getSystemClient().getRoles();
      const viewerRole = roles.find((r) => r.name === 'viewer');
      if (viewerRole) {
        await ctx.getSystemClient().createUserRole({
          user_id: viewerUserId,
          role_id: viewerRole.id,
          tenant_id: ctx.tenant.id,
          shop_id: ctx.shop.id,
        });
      }
    });

    afterAll(async () => {
      if (viewerUserId) {
        await cleanupUser(app, viewerUserId);
      }
    });

    it('viewer should be able to list statuses', async () => {
      const statuses = await viewerClient.getStatuses(ctx.shopContext);

      expect(Array.isArray(statuses)).toBe(true);
    });

    it('viewer should be able to get single status', async () => {
      const statuses = await viewerClient.getStatuses(ctx.shopContext);
      if (statuses.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length check ensures element exists
        const firstStatus = statuses[0]!;
        const status = await viewerClient.getStatus(firstStatus.id, ctx.shopContext);
        expect(status.id).toBe(firstStatus.id);
      }
    });

    it('viewer should NOT be able to create status', async () => {
      try {
        await viewerClient.createStatus(
          { code: 'viewer-status', title: 'Should Fail' },
          ctx.shopContext,
        );
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });

    it('viewer should NOT be able to update status', async () => {
      const statuses = await viewerClient.getStatuses(ctx.shopContext);
      if (statuses.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length check ensures element exists
        const firstStatus = statuses[0]!;
        try {
          await viewerClient.updateStatus(firstStatus.id, { title: 'Should Fail' }, ctx.shopContext);
          expect.fail('Should have thrown ApiError');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(403);
        }
      }
    });

    it('viewer should NOT be able to delete status', async () => {
      const statuses = await viewerClient.getStatuses(ctx.shopContext);
      if (statuses.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length check ensures element exists
        const firstStatus = statuses[0]!;
        try {
          await viewerClient.deleteStatus(firstStatus.id, ctx.shopContext);
          expect.fail('Should have thrown ApiError');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(403);
        }
      }
    });

    it('viewer should be able to export statuses', async () => {
      const exported = await viewerClient.exportStatusesJson(ctx.shopContext);
      expect(Array.isArray(exported)).toBe(true);
    });

    it('viewer should NOT be able to import statuses', async () => {
      try {
        await viewerClient.importStatusesJson(
          [{ code: 'test', title: 'Should Fail' }],
          ctx.shopContext,
        );
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });
  });
});
