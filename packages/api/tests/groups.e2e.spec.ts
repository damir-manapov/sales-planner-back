import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ROLE_NAMES } from '../src/common/constants.js';
import { normalizeCode } from '../src/lib/normalize-code.js';
import { TestContext } from './test-context.js';
import {
  cleanupUser,
  expectConflict,
  expectForbidden,
  expectNotFound,
  expectUnauthorized,
  generateTestCode,
  generateUniqueId,
} from './test-helpers.js';

describe('Groups (e2e)', () => {
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
      tenantTitle: `Test Tenant ${generateUniqueId()}`,
      userEmail: `group-test-${generateUniqueId()}@example.com`,
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
      await expectUnauthorized(() => noAuthClient.getGroups(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.getGroups(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create group', async () => {
      const newGroup = { code: generateTestCode('group'), title: 'Test Group' };
      const group = await ctx.client.createGroup(newGroup, ctx.shopContext);

      expect(group).toHaveProperty('id');
      expect(group.code).toBe(normalizeCode(newGroup.code));
      expect(group.title).toBe(newGroup.title);
      expect(group.shop_id).toBe(ctx.shop.id);
      expect(group.tenant_id).toBe(ctx.tenant.id);
    });

    it('should list groups', async () => {
      await ctx.client.createGroup(
        { code: generateTestCode('group-list'), title: 'List Group' },
        ctx.shopContext,
      );

      const groups = await ctx.client.getGroups(ctx.shopContext);

      expect(Array.isArray(groups)).toBe(true);
      expect(groups.length).toBeGreaterThan(0);
    });

    it('should get group by id', async () => {
      const created = await ctx.client.createGroup(
        { code: generateTestCode('group-get'), title: 'Get Group' },
        ctx.shopContext,
      );

      const group = await ctx.client.getGroup(created.id, ctx.shopContext);

      expect(group.id).toBe(created.id);
    });

    it('should get group by code', async () => {
      const created = await ctx.client.createGroup(
        { code: generateTestCode('group-get-code'), title: 'Get Group Code' },
        ctx.shopContext,
      );

      const group = await ctx.client.getGroupByCode(created.code, ctx.shopContext);

      expect(group.id).toBe(created.id);
      expect(group.code).toBe(created.code);
    });

    it('should update group', async () => {
      const created = await ctx.client.createGroup(
        { code: generateTestCode('group-update'), title: 'To Update' },
        ctx.shopContext,
      );

      const group = await ctx.client.updateGroup(
        created.id,
        { title: 'Updated Group Title' },
        ctx.shopContext,
      );

      expect(group.title).toBe('Updated Group Title');
    });

    it('should return 409 on duplicate code', async () => {
      const duplicateCode = generateTestCode('group');
      await ctx.client.createGroup({ code: duplicateCode, title: 'First Group' }, ctx.shopContext);

      await expectConflict(() =>
        ctx.client.createGroup({ code: duplicateCode, title: 'Duplicate Group' }, ctx.shopContext),
      );
    });
  });

  describe('Delete operations', () => {
    it('should delete group', async () => {
      const toDelete = await ctx.client.createGroup(
        { code: generateTestCode('group-delete'), title: 'Delete Group' },
        ctx.shopContext,
      );

      await ctx.client.deleteGroup(toDelete.id, ctx.shopContext);
      await expectNotFound(() => ctx.client.getGroup(toDelete.id, ctx.shopContext));
    });
  });

  describe('Tenant-based access control', () => {
    let otherCtx: TestContext;

    beforeAll(async () => {
      otherCtx = await TestContext.create(app, baseUrl, {
        tenantTitle: `Other Tenant ${generateUniqueId()}`,
        userEmail: `other-tenant-${generateUniqueId()}@example.com`,
        userName: 'Other Tenant User',
      });
    });

    afterAll(async () => {
      if (otherCtx) await otherCtx.dispose();
    });

    it('should return 403 when accessing other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.getGroups({
          shop_id: otherCtx.shop.id,
          tenant_id: otherCtx.tenant.id,
        }),
      );
    });

    it('should return 403 when creating for other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.createGroup(
          { code: 'forbidden-group', title: 'Should Fail' },
          { shop_id: ctx.shop.id, tenant_id: otherCtx.tenant.id },
        ),
      );
    });

    it('should return 404 when getting resource from other tenant', async () => {
      const otherGroup = await otherCtx.client.createGroup(
        { code: generateTestCode('other'), title: 'Other Group' },
        otherCtx.shopContext,
      );

      await expectNotFound(() => ctx.client.getGroup(otherGroup.id, ctx.shopContext));
    });

    it('should allow same code in different tenants', async () => {
      const sharedCode = generateTestCode('shared');

      const group1 = await ctx.client.createGroup(
        { code: sharedCode, title: 'Group in Tenant 1' },
        ctx.shopContext,
      );
      const group2 = await otherCtx.client.createGroup(
        { code: sharedCode, title: 'Group in Tenant 2' },
        otherCtx.shopContext,
      );

      expect(group1.code).toBe(normalizeCode(sharedCode));
      expect(group2.code).toBe(normalizeCode(sharedCode));
      expect(group1.tenant_id).not.toBe(group2.tenant_id);
    });
  });

  describe('Import/Export', () => {
    it('should import groups from JSON', async () => {
      const code1 = generateTestCode('import-json-1');
      const code2 = generateTestCode('import-json-2');
      const items = [
        { code: code1, title: 'Import JSON Group 1' },
        { code: code2, title: 'Import JSON Group 2' },
      ];

      const result = await ctx.client.importGroupsJson(items, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      const groups = await ctx.client.getGroups(ctx.shopContext);
      const codes = groups.map((g) => g.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should upsert existing groups on import', async () => {
      const code = generateTestCode('upsert-json');

      await ctx.client.importGroupsJson([{ code, title: 'Original Title' }], ctx.shopContext);
      const result = await ctx.client.importGroupsJson(
        [{ code, title: 'Updated Title' }],
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should import groups from CSV with commas', async () => {
      const code1 = generateTestCode('import-csv-1');
      const code2 = generateTestCode('import-csv-2');
      const csvContent = `code,title\n${code1},Import CSV Group 1\n${code2},Import CSV Group 2`;

      const result = await ctx.client.importGroupsCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const groups = await ctx.client.getGroups(ctx.shopContext);
      const codes = groups.map((g) => g.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should import groups from CSV with semicolons', async () => {
      const code1 = generateTestCode('import-semi-1');
      const code2 = generateTestCode('import-semi-2');
      const csvContent = `code;title\n${code1};Import Semicolon Group 1\n${code2};Import Semicolon Group 2`;

      const result = await ctx.client.importGroupsCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const groups = await ctx.client.getGroups(ctx.shopContext);
      const codes = groups.map((g) => g.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should handle Cyrillic characters in CSV', async () => {
      const csvContent = `code;title\nmavyko;Мавико\nmarshall;MARSHALL\nmazda;Mazda`;

      const result = await ctx.client.importGroupsCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(3);
      expect(result.updated).toBe(0);

      const groups = await ctx.client.getGroups(ctx.shopContext);
      const mavyko = groups.find((g) => g.code === 'mavyko');
      expect(mavyko).toBeDefined();
      expect(mavyko?.title).toBe('Мавико');
    });

    it('should export groups to JSON', async () => {
      const code1 = generateTestCode('export-group-1');
      const code2 = generateTestCode('export-group-2');

      await ctx.client.importGroupsJson(
        [
          { code: code1, title: 'Export Test Group 1' },
          { code: code2, title: 'Export Test Group 2' },
        ],
        ctx.shopContext,
      );

      const exported = await ctx.client.exportGroupsJson(ctx.shopContext);

      expect(Array.isArray(exported)).toBe(true);
      const exportedCodes = exported.map((g) => g.code);
      expect(exportedCodes).toContain(normalizeCode(code1));
      expect(exportedCodes).toContain(normalizeCode(code2));

      const item = exported.find((g) => g.code === normalizeCode(code1));
      expect(item).toEqual({ code: normalizeCode(code1), title: 'Export Test Group 1' });
    });

    it('should export groups to CSV', async () => {
      const code1 = generateTestCode('csv-export-group-1');
      const code2 = generateTestCode('csv-export-group-2');

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

  describe('Example downloads', () => {
    it('should return JSON example', async () => {
      const examples = await ctx.client.getGroupsExampleJson();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('code');
      expect(examples[0]).toHaveProperty('title');
    });

    it('should return CSV example', async () => {
      const csv = await ctx.client.getGroupsExampleCsv();

      expect(typeof csv).toBe('string');
      expect(csv).toContain('code,title');
    });
  });

  describe('Role-based access', () => {
    describe('Editor role', () => {
      let editorUserId: number;
      let editorClient: SalesPlannerClient;

      beforeAll(async () => {
        const editorUser = await ctx.getSystemClient().createUser({
          email: `editor-${generateUniqueId()}@example.com`,
          name: 'Editor User',
        });
        editorUserId = editorUser.id;

        const editorApiKey = await ctx.getSystemClient().createApiKey({
          user_id: editorUserId,
          name: 'Editor Key',
        });
        editorClient = new SalesPlannerClient({ baseUrl, apiKey: editorApiKey.key });

        const roles = await ctx.getSystemClient().getRoles();
        const editorRole = roles.find((r) => r.name === ROLE_NAMES.EDITOR);
        if (!editorRole) throw new Error('Editor role not found');
        {
          await ctx.getSystemClient().createUserRole({
            user_id: editorUserId,
            role_id: editorRole.id,
            tenant_id: ctx.tenant.id,
            shop_id: ctx.shop.id,
          });
        }
      });

      afterAll(async () => {
        if (editorUserId) await cleanupUser(app, editorUserId);
      });

      it('editor should list groups', async () => {
        const groups = await editorClient.getGroups(ctx.shopContext);
        expect(Array.isArray(groups)).toBe(true);
      });

      it('editor should create group', async () => {
        const group = await editorClient.createGroup(
          { code: generateTestCode('editor-group'), title: 'Editor Group' },
          ctx.shopContext,
        );
        expect(group).toHaveProperty('id');
      });

      it('editor should update group', async () => {
        const groups = await editorClient.getGroups(ctx.shopContext);
        if (groups.length > 0) {
          const firstGroup = groups[0];
          if (!firstGroup) throw new Error('Expected group');
          const updated = await editorClient.updateGroup(
            firstGroup.id,
            { title: 'Editor Updated' },
            ctx.shopContext,
          );
          expect(updated.title).toBe('Editor Updated');
        }
      });

      it('editor should delete group', async () => {
        const group = await editorClient.createGroup(
          { code: generateTestCode('editor-delete'), title: 'To Delete' },
          ctx.shopContext,
        );
        await editorClient.deleteGroup(group.id, ctx.shopContext);
        await expectNotFound(() => editorClient.getGroup(group.id, ctx.shopContext));
      });

      it('editor should import groups', async () => {
        const result = await editorClient.importGroupsJson(
          [{ code: generateTestCode('editor-import'), title: 'Editor Import' }],
          ctx.shopContext,
        );
        expect(result.created).toBe(1);
      });

      it('editor should export groups', async () => {
        const exported = await editorClient.exportGroupsJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });
    });

    describe('Viewer role', () => {
      let viewerUserId: number;
      let viewerClient: SalesPlannerClient;

      beforeAll(async () => {
        const viewerUser = await ctx.getSystemClient().createUser({
          email: `viewer-${generateUniqueId()}@example.com`,
          name: 'Viewer User',
        });
        viewerUserId = viewerUser.id;

        const viewerApiKey = await ctx.getSystemClient().createApiKey({
          user_id: viewerUserId,
          name: 'Viewer Key',
        });
        viewerClient = new SalesPlannerClient({ baseUrl, apiKey: viewerApiKey.key });

        const roles = await ctx.getSystemClient().getRoles();
        const viewerRole = roles.find((r) => r.name === ROLE_NAMES.VIEWER);
        if (!viewerRole) throw new Error('Viewer role not found');
        {
          await ctx.getSystemClient().createUserRole({
            user_id: viewerUserId,
            role_id: viewerRole.id,
            tenant_id: ctx.tenant.id,
            shop_id: ctx.shop.id,
          });
        }
      });

      afterAll(async () => {
        if (viewerUserId) await cleanupUser(app, viewerUserId);
      });

      it('viewer should list groups', async () => {
        const groups = await viewerClient.getGroups(ctx.shopContext);
        expect(Array.isArray(groups)).toBe(true);
      });

      it('viewer should get group by id', async () => {
        const groups = await viewerClient.getGroups(ctx.shopContext);
        if (groups.length > 0) {
          const firstGroup = groups[0];
          if (!firstGroup) throw new Error('Expected group');
          const group = await viewerClient.getGroup(firstGroup.id, ctx.shopContext);
          expect(group.id).toBe(firstGroup.id);
        }
      });

      it('viewer should NOT create group', async () => {
        await expectForbidden(() =>
          viewerClient.createGroup({ code: 'viewer-group', title: 'Should Fail' }, ctx.shopContext),
        );
      });

      it('viewer should NOT update group', async () => {
        const groups = await viewerClient.getGroups(ctx.shopContext);
        if (groups.length > 0) {
          const firstGroup = groups[0];
          if (!firstGroup) throw new Error('Expected group');
          await expectForbidden(() =>
            viewerClient.updateGroup(firstGroup.id, { title: 'Should Fail' }, ctx.shopContext),
          );
        }
      });

      it('viewer should NOT delete group', async () => {
        const groups = await viewerClient.getGroups(ctx.shopContext);
        if (groups.length > 0) {
          const firstGroup = groups[0];
          if (!firstGroup) throw new Error('Expected group');
          await expectForbidden(() => viewerClient.deleteGroup(firstGroup.id, ctx.shopContext));
        }
      });

      it('viewer should export groups', async () => {
        const exported = await viewerClient.exportGroupsJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('viewer should NOT import groups', async () => {
        await expectForbidden(() =>
          viewerClient.importGroupsJson([{ code: 'test', title: 'Should Fail' }], ctx.shopContext),
        );
      });
    });
  });
});
