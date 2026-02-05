import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError, SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { normalizeCode } from '../src/lib/normalize-code.js';
import { TestContext } from './test-context.js';
import { cleanupUser } from './test-helpers.js';

describe('Groups (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let groupId: number;

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
      userEmail: `group-test-${Date.now()}@example.com`,
      userName: 'Group Test User',
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
        await noAuthClient.getGroups(ctx.shopContext);
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });

      try {
        await badClient.getGroups(ctx.shopContext);
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });
  });

  describe('CRUD operations', () => {
    it('createGroup - should create group', async () => {
      const newGroup = { code: `group-${Date.now()}`, title: 'Test Group' };
      const group = await ctx.client.createGroup(newGroup, ctx.shopContext);

      expect(group).toHaveProperty('id');
      expect(group.code).toBe(normalizeCode(newGroup.code));
      expect(group.title).toBe(newGroup.title);
      expect(group.shop_id).toBe(ctx.shop.id);
      expect(group.tenant_id).toBe(ctx.tenant.id);

      groupId = group.id;
    });

    it('getGroups - should return groups for shop and tenant', async () => {
      const groups = await ctx.client.getGroups(ctx.shopContext);

      expect(Array.isArray(groups)).toBe(true);
      expect(groups.length).toBeGreaterThan(0);
    });

    it('getGroup - should return group by id', async () => {
      const group = await ctx.client.getGroup(groupId, ctx.shopContext);

      expect(group.id).toBe(groupId);
    });

    it('updateGroup - should update group', async () => {
      const group = await ctx.client.updateGroup(
        groupId,
        { title: 'Updated Group Title' },
        ctx.shopContext,
      );

      expect(group.title).toBe('Updated Group Title');
    });

    it('createGroup - should return 409 on duplicate code in same shop', async () => {
      const duplicateCode = `group-${Date.now()}`;
      await ctx.client.createGroup({ code: duplicateCode, title: 'First Group' }, ctx.shopContext);

      try {
        await ctx.client.createGroup(
          { code: duplicateCode, title: 'Duplicate Group' },
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
        await ctx.client.getGroups({
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

    it('should return 403 when creating group for wrong tenant', async () => {
      const otherSetup = await ctx.getSystemClient().createTenantWithShopAndUser({
        tenantTitle: `Other Tenant ${Date.now()}`,
        userEmail: `other2-${Date.now()}@example.com`,
        userName: 'Other User 2',
      });

      try {
        await ctx.client.createGroup(
          { code: 'forbidden-group', title: 'Should Fail' },
          { shop_id: ctx.shop.id, tenant_id: otherSetup.tenant.id },
        );
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }

      await cleanupUser(app, otherSetup.user.id);
    });

    it('should return 404 for group in wrong tenant', async () => {
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
        await ctx.client.getGroup(groupId, {
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
    it('deleteGroup - should delete group', async () => {
      await ctx.client.deleteGroup(groupId, ctx.shopContext);

      try {
        await ctx.client.getGroup(groupId, ctx.shopContext);
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }

      groupId = 0;
    });
  });

  describe('Import endpoints', () => {
    it('importGroupsJson - should import groups from JSON', async () => {
      const code1 = `import-json-1-${Date.now()}`;
      const code2 = `import-json-2-${Date.now()}`;
      const items = [
        { code: code1, title: 'Import JSON Group 1' },
        { code: code2, title: 'Import JSON Group 2' },
      ];

      const result = await ctx.client.importGroupsJson(items, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      const groups = await ctx.client.getGroups(ctx.shopContext);
      const codes = groups.map((b) => b.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('importGroupsJson - should upsert existing groups', async () => {
      const code = `upsert-json-${Date.now()}`;

      await ctx.client.importGroupsJson([{ code, title: 'Original Title' }], ctx.shopContext);
      const result = await ctx.client.importGroupsJson(
        [{ code, title: 'Updated Title' }],
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('importGroupsCsv - should import groups from CSV with commas', async () => {
      const code1 = `import-csv-1-${Date.now()}`;
      const code2 = `import-csv-2-${Date.now()}`;
      const csvContent = `code,title\n${code1},Import CSV Group 1\n${code2},Import CSV Group 2`;

      const result = await ctx.client.importGroupsCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const groups = await ctx.client.getGroups(ctx.shopContext);
      const codes = groups.map((b) => b.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('importGroupsCsv - should import groups from CSV with semicolons', async () => {
      const code1 = `import-semi-1-${Date.now()}`;
      const code2 = `import-semi-2-${Date.now()}`;
      const csvContent = `code;title\n${code1};Import Semicolon Group 1\n${code2};Import Semicolon Group 2`;

      const result = await ctx.client.importGroupsCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const groups = await ctx.client.getGroups(ctx.shopContext);
      const codes = groups.map((b) => b.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('importGroupsCsv - should handle Cyrillic characters with semicolons', async () => {
      const csvContent = `code;title\nmavyko;Мавико\nmarshall;MARSHALL\nmazda;Mazda`;

      const result = await ctx.client.importGroupsCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(3);
      expect(result.updated).toBe(0);

      const groups = await ctx.client.getGroups(ctx.shopContext);
      const mavyko = groups.find((b) => b.code === 'mavyko');
      expect(mavyko).toBeDefined();
      expect(mavyko?.title).toBe('Мавико');
    });

    it('exportGroupsJson - should export groups in import format', async () => {
      const code1 = `export-group-1-${Date.now()}`;
      const code2 = `export-group-2-${Date.now()}`;

      await ctx.client.importGroupsJson(
        [
          { code: code1, title: 'Export Test Group 1' },
          { code: code2, title: 'Export Test Group 2' },
        ],
        ctx.shopContext,
      );

      const exported = await ctx.client.exportGroupsJson(ctx.shopContext);

      expect(Array.isArray(exported)).toBe(true);
      const exportedCodes = exported.map((b) => b.code);
      expect(exportedCodes).toContain(normalizeCode(code1));
      expect(exportedCodes).toContain(normalizeCode(code2));

      const item = exported.find((b) => b.code === normalizeCode(code1));
      expect(item).toEqual({ code: normalizeCode(code1), title: 'Export Test Group 1' });
    });

    it('exportGroupsCsv - should export groups in CSV format', async () => {
      const code1 = `csv-export-group-1-${Date.now()}`;
      const code2 = `csv-export-group-2-${Date.now()}`;

      await ctx.client.importGroupsJson(
        [
          { code: code1, title: 'CSV Export Test 1' },
          { code: code2, title: 'CSV Export Test 2' },
        ],
        ctx.shopContext,
      );

      const csv = await ctx.client.exportGroupsCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('code,title');
      expect(lines.some((line) => line.includes(normalizeCode(code1)))).toBe(true);
      expect(lines.some((line) => line.includes(normalizeCode(code2)))).toBe(true);
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

    it('viewer should be able to list groups', async () => {
      const groups = await viewerClient.getGroups(ctx.shopContext);

      expect(Array.isArray(groups)).toBe(true);
    });

    it('viewer should be able to get single group', async () => {
      const groups = await viewerClient.getGroups(ctx.shopContext);
      if (groups.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length check ensures element exists
        const firstGroup = groups[0]!;
        const group = await viewerClient.getGroup(firstGroup.id, ctx.shopContext);
        expect(group.id).toBe(firstGroup.id);
      }
    });

    it('viewer should NOT be able to create group', async () => {
      try {
        await viewerClient.createGroup(
          { code: 'viewer-group', title: 'Should Fail' },
          ctx.shopContext,
        );
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });

    it('viewer should NOT be able to update group', async () => {
      const groups = await viewerClient.getGroups(ctx.shopContext);
      if (groups.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length check ensures element exists
        const firstGroup = groups[0]!;
        try {
          await viewerClient.updateGroup(firstGroup.id, { title: 'Should Fail' }, ctx.shopContext);
          expect.fail('Should have thrown ApiError');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(403);
        }
      }
    });

    it('viewer should NOT be able to delete group', async () => {
      const groups = await viewerClient.getGroups(ctx.shopContext);
      if (groups.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length check ensures element exists
        const firstGroup = groups[0]!;
        try {
          await viewerClient.deleteGroup(firstGroup.id, ctx.shopContext);
          expect.fail('Should have thrown ApiError');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(403);
        }
      }
    });

    it('viewer should be able to export groups', async () => {
      const exported = await viewerClient.exportGroupsJson(ctx.shopContext);
      expect(Array.isArray(exported)).toBe(true);
    });

    it('viewer should NOT be able to import groups', async () => {
      try {
        await viewerClient.importGroupsJson(
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
