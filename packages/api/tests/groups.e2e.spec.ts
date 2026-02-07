import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError, SalesPlannerClient } from '@sales-planner/http-client';
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
      await expectUnauthorized(() => noAuthClient.groups.getAll(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.groups.getAll(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create group', async () => {
      const newGroup = { code: generateTestCode('group'), title: 'Test Group' };
      const group = await ctx.client.groups.create(ctx.shopContext, newGroup);

      expect(group).toHaveProperty('id');
      expect(group.code).toBe(normalizeCode(newGroup.code));
      expect(group.title).toBe(newGroup.title);
      expect(group.shop_id).toBe(ctx.shop.id);
      expect(group.tenant_id).toBe(ctx.tenant.id);
    });

    it('should list groups', async () => {
      await ctx.client.groups.create(ctx.shopContext, {
        code: generateTestCode('group-list'),
        title: 'List Group',
      });

      const groups = await ctx.client.groups.getAll(ctx.shopContext);

      expect(Array.isArray(groups.items)).toBe(true);
      expect(groups.items.length).toBeGreaterThan(0);
    });

    it('should get group by id', async () => {
      const created = await ctx.client.groups.create(ctx.shopContext, {
        code: generateTestCode('group-get'),
        title: 'Get Group',
      });

      const group = await ctx.client.groups.getById(ctx.shopContext, created.id);

      expect(group.id).toBe(created.id);
    });

    it('should get group by code', async () => {
      const created = await ctx.client.groups.create(ctx.shopContext, {
        code: generateTestCode('group-get-code'),
        title: 'Get Group Code',
      });

      const group = await ctx.client.groups.getByCode(ctx.shopContext, created.code);

      expect(group.id).toBe(created.id);
      expect(group.code).toBe(created.code);
    });

    it('should update group', async () => {
      const created = await ctx.client.groups.create(ctx.shopContext, {
        code: generateTestCode('group-update'),
        title: 'To Update',
      });

      const group = await ctx.client.groups.update(ctx.shopContext, created.id, {
        title: 'Updated Group Title',
      });

      expect(group.title).toBe('Updated Group Title');
    });

    it('should return 409 on duplicate code', async () => {
      const duplicateCode = generateTestCode('group');
      await ctx.client.groups.create(ctx.shopContext, {
        code: duplicateCode,
        title: 'First Group',
      });

      await expectConflict(() =>
        ctx.client.groups.create(ctx.shopContext, {
          code: duplicateCode,
          title: 'Duplicate Group',
        }),
      );
    });
  });

  describe('Pagination', () => {
    const paginationItems: { id: number; code: string }[] = [];

    beforeAll(async () => {
      for (let i = 0; i < 15; i++) {
        const item = await ctx.client.groups.create(ctx.shopContext, {
          code: generateTestCode(`pagination-group-${i.toString().padStart(2, '0')}`),
          title: `Pagination Group ${i}`,
        });
        paginationItems.push({ id: item.id, code: item.code });
      }
    });

    afterAll(async () => {
      for (const item of paginationItems) {
        try {
          await ctx.client.groups.delete(ctx.shopContext, item.id);
        } catch {
          // Ignore errors during cleanup
        }
      }
    });

    it('should return paginated response with metadata', async () => {
      const response = await ctx.client.groups.getAll(ctx.shopContext);

      expect(response).toHaveProperty('items');
      expect(response).toHaveProperty('total');
      expect(response).toHaveProperty('limit');
      expect(response).toHaveProperty('offset');
      expect(Array.isArray(response.items)).toBe(true);
      expect(response.offset).toBe(0);
    });

    it('should respect custom limit and offset', async () => {
      const response = await ctx.client.groups.getAll(ctx.shopContext, { limit: 5, offset: 3 });

      expect(response.items.length).toBeLessThanOrEqual(5);
      expect(response.limit).toBe(5);
      expect(response.offset).toBe(3);
    });

    it('should return different items on different pages', async () => {
      const firstPage = await ctx.client.groups.getAll(ctx.shopContext, { limit: 5, offset: 0 });
      const secondPage = await ctx.client.groups.getAll(ctx.shopContext, { limit: 5, offset: 5 });

      if (firstPage.items.length > 0 && secondPage.items.length > 0) {
        const firstPageIds = firstPage.items.map((b) => b.id);
        const secondPageIds = secondPage.items.map((b) => b.id);
        const overlap = firstPageIds.filter((id) => secondPageIds.includes(id));
        expect(overlap.length).toBe(0);
      }
    });

    it('should return correct total count', async () => {
      const response = await ctx.client.groups.getAll(ctx.shopContext, { limit: 5 });
      expect(response.total).toBeGreaterThanOrEqual(15);
    });

    it('should paginate through all items correctly', async () => {
      const pageSize = 5;
      const allItems: number[] = [];
      let offset = 0;
      let total = 0;

      do {
        const response = await ctx.client.groups.getAll(ctx.shopContext, {
          limit: pageSize,
          offset,
        });
        total = response.total;
        allItems.push(...response.items.map((b) => b.id));
        offset += pageSize;
      } while (allItems.length < total);

      const uniqueIds = new Set(allItems);
      expect(uniqueIds.size).toBe(total);
    });
  });

  describe('Delete operations', () => {
    it('should delete group', async () => {
      const toDelete = await ctx.client.groups.create(ctx.shopContext, {
        code: generateTestCode('group-delete'),
        title: 'Delete Group',
      });

      await ctx.client.groups.delete(ctx.shopContext, toDelete.id);
      await expectNotFound(() => ctx.client.groups.getById(ctx.shopContext, toDelete.id));
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
        ctx.client.groups.getAll({
          shop_id: otherCtx.shop.id,
          tenant_id: otherCtx.tenant.id,
        }),
      );
    });

    it('should return 403 when creating for other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.groups.create(
          { shop_id: ctx.shop.id, tenant_id: otherCtx.tenant.id },
          { code: 'forbidden-group', title: 'Should Fail' },
        ),
      );
    });

    it('should return 404 when getting resource from other tenant', async () => {
      const otherGroup = await otherCtx.client.groups.create(otherCtx.shopContext, {
        code: generateTestCode('other'),
        title: 'Other Group',
      });

      await expectNotFound(() => ctx.client.groups.getById(ctx.shopContext, otherGroup.id));
      await expectForbidden(() =>
        ctx.client.groups.getByCode(
          {
            shop_id: ctx.shop.id,
            tenant_id: otherCtx.tenant.id,
          },
          otherGroup.code,
        ),
      );
    });

    it('should allow same code in different tenants', async () => {
      const sharedCode = generateTestCode('shared');

      const group1 = await ctx.client.groups.create(ctx.shopContext, {
        code: sharedCode,
        title: 'Group in Tenant 1',
      });
      const group2 = await otherCtx.client.groups.create(otherCtx.shopContext, {
        code: sharedCode,
        title: 'Group in Tenant 2',
      });

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

      const result = await ctx.client.groups.importJson(ctx.shopContext, items);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      const groups = await ctx.client.groups.getAll(ctx.shopContext);
      const codes = groups.items.map((g) => g.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should upsert existing groups on import', async () => {
      const code = generateTestCode('upsert-json');

      await ctx.client.groups.importJson(ctx.shopContext, [{ code, title: 'Original Title' }]);
      const result = await ctx.client.groups.importJson(ctx.shopContext, [
        { code, title: 'Updated Title' },
      ]);

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should import groups from CSV with commas', async () => {
      const code1 = generateTestCode('import-csv-1');
      const code2 = generateTestCode('import-csv-2');
      const csvContent = `code,title\n${code1},Import CSV Group 1\n${code2},Import CSV Group 2`;

      const result = await ctx.client.groups.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const groups = await ctx.client.groups.getAll(ctx.shopContext);
      const codes = groups.items.map((g) => g.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should import groups from CSV with semicolons', async () => {
      const code1 = generateTestCode('import-semi-1');
      const code2 = generateTestCode('import-semi-2');
      const csvContent = `code;title\n${code1};Import Semicolon Group 1\n${code2};Import Semicolon Group 2`;

      const result = await ctx.client.groups.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const groups = await ctx.client.groups.getAll(ctx.shopContext);
      const codes = groups.items.map((g) => g.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should handle Cyrillic characters in CSV', async () => {
      const csvContent = `code;title\nmavyko;Мавико\nmarshall;MARSHALL\nmazda;Mazda`;

      const result = await ctx.client.groups.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(3);
      expect(result.updated).toBe(0);

      const groups = await ctx.client.groups.getAll(ctx.shopContext);
      const mavyko = groups.items.find((g) => g.code === 'mavyko');
      expect(mavyko).toBeDefined();
      expect(mavyko?.title).toBe('Мавико');
    });

    it('should export groups to JSON', async () => {
      const code1 = generateTestCode('export-group-1');
      const code2 = generateTestCode('export-group-2');

      await ctx.client.groups.importJson(ctx.shopContext, [
        { code: code1, title: 'Export Test Group 1' },
        { code: code2, title: 'Export Test Group 2' },
      ]);

      const exported = await ctx.client.groups.exportJson(ctx.shopContext);

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

      await ctx.client.groups.importJson(ctx.shopContext, [
        { code: code1, title: 'CSV Export Test 1' },
        { code: code2, title: 'CSV Export Test 2' },
      ]);

      const csv = await ctx.client.groups.exportCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('code,title');
      expect(lines.some((line) => line.includes(normalizeCode(code1)))).toBe(true);
      expect(lines.some((line) => line.includes(normalizeCode(code2)))).toBe(true);
    });

    it('should reject import with duplicate codes', async () => {
      const code = generateTestCode('dup-group');
      const csvContent = `code,title\n${code},First Group\n${code},Second Group`;

      try {
        await ctx.client.groups.importCsv(ctx.shopContext, csvContent);
        expect.fail('Expected ApiError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).message).toContain('Duplicate code found');
      }
    });
  });

  describe('Example downloads', () => {
    it('should return JSON example', async () => {
      const examples = await ctx.client.groups.getExampleJson();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('code');
      expect(examples[0]).toHaveProperty('title');
    });

    it('should return CSV example', async () => {
      const csv = await ctx.client.groups.getExampleCsv();

      expect(typeof csv).toBe('string');
      expect(csv).toContain('code,title');
    });
  });

  describe('Role-based access', () => {
    describe('Editor role', () => {
      let editorUserId: number;
      let editorClient: SalesPlannerClient;

      beforeAll(async () => {
        const editorUser = await ctx.getSystemClient().users.create({
          email: `editor-${generateUniqueId()}@example.com`,
          name: 'Editor User',
        });
        editorUserId = editorUser.id;

        const editorApiKey = await ctx.getSystemClient().apiKeys.create({
          user_id: editorUserId,
          name: 'Editor Key',
        });
        editorClient = new SalesPlannerClient({ baseUrl, apiKey: editorApiKey.key });

        const roles = await ctx.getSystemClient().roles.getAll();
        const editorRole = roles.items.find((r) => r.name === ROLE_NAMES.EDITOR);
        if (!editorRole) throw new Error('Editor role not found');
        await ctx.getSystemClient().userRoles.create({
          user_id: editorUserId,
          role_id: editorRole.id,
          tenant_id: ctx.tenant.id,
          shop_id: ctx.shop.id,
        });
      });

      afterAll(async () => {
        if (editorUserId) await cleanupUser(app, editorUserId);
      });

      it('editor should list groups', async () => {
        const groups = await editorClient.groups.getAll(ctx.shopContext);
        expect(Array.isArray(groups.items)).toBe(true);
      });

      it('editor should create group', async () => {
        const group = await editorClient.groups.create(ctx.shopContext, {
          code: generateTestCode('editor-group'),
          title: 'Editor Group',
        });
        expect(group).toHaveProperty('id');
      });

      it('editor should get group by code', async () => {
        const groups = await editorClient.groups.getAll(ctx.shopContext);
        if (groups.items.length === 0) throw new Error('Expected at least one group for editor');
        const firstGroup = groups.items[0];
        if (!firstGroup) throw new Error('Expected group');
        const group = await editorClient.groups.getByCode(ctx.shopContext, firstGroup.code);
        expect(group.id).toBe(firstGroup.id);
      });

      it('editor should update group', async () => {
        const groups = await editorClient.groups.getAll(ctx.shopContext);
        if (groups.items.length > 0) {
          const firstGroup = groups.items[0];
          if (!firstGroup) throw new Error('Expected group');
          const updated = await editorClient.groups.update(ctx.shopContext, firstGroup.id, {
            title: 'Editor Updated',
          });
          expect(updated.title).toBe('Editor Updated');
        }
      });

      it('editor should delete group', async () => {
        const group = await editorClient.groups.create(ctx.shopContext, {
          code: generateTestCode('editor-delete'),
          title: 'To Delete',
        });
        await editorClient.groups.delete(ctx.shopContext, group.id);
        await expectNotFound(() => editorClient.groups.getById(ctx.shopContext, group.id));
      });

      it('editor should import groups', async () => {
        const result = await editorClient.groups.importJson(ctx.shopContext, [
          { code: generateTestCode('editor-import'), title: 'Editor Import' },
        ]);
        expect(result.created).toBe(1);
      });

      it('editor should export groups', async () => {
        const exported = await editorClient.groups.exportJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });
    });

    describe('Viewer role', () => {
      let viewerUserId: number;
      let viewerClient: SalesPlannerClient;

      beforeAll(async () => {
        const viewerUser = await ctx.getSystemClient().users.create({
          email: `viewer-${generateUniqueId()}@example.com`,
          name: 'Viewer User',
        });
        viewerUserId = viewerUser.id;

        const viewerApiKey = await ctx.getSystemClient().apiKeys.create({
          user_id: viewerUserId,
          name: 'Viewer Key',
        });
        viewerClient = new SalesPlannerClient({ baseUrl, apiKey: viewerApiKey.key });

        const roles = await ctx.getSystemClient().roles.getAll();
        const viewerRole = roles.items.find((r) => r.name === ROLE_NAMES.VIEWER);
        if (!viewerRole) throw new Error('Viewer role not found');
        await ctx.getSystemClient().userRoles.create({
          user_id: viewerUserId,
          role_id: viewerRole.id,
          tenant_id: ctx.tenant.id,
          shop_id: ctx.shop.id,
        });
      });

      afterAll(async () => {
        if (viewerUserId) await cleanupUser(app, viewerUserId);
      });

      it('viewer should list groups', async () => {
        const groups = await viewerClient.groups.getAll(ctx.shopContext);
        expect(Array.isArray(groups.items)).toBe(true);
      });

      it('viewer should get group by code', async () => {
        const groups = await viewerClient.groups.getAll(ctx.shopContext);
        if (groups.items.length === 0) throw new Error('Expected at least one group for viewer');
        const firstGroup = groups.items[0];
        if (!firstGroup) throw new Error('Expected group');
        const group = await viewerClient.groups.getByCode(ctx.shopContext, firstGroup.code);
        expect(group.id).toBe(firstGroup.id);
      });

      it('viewer should get group by id', async () => {
        const groups = await viewerClient.groups.getAll(ctx.shopContext);
        if (groups.items.length > 0) {
          const firstGroup = groups.items[0];
          if (!firstGroup) throw new Error('Expected group');
          const group = await viewerClient.groups.getById(ctx.shopContext, firstGroup.id);
          expect(group.id).toBe(firstGroup.id);
        }
      });

      it('viewer should NOT create group', async () => {
        await expectForbidden(() =>
          viewerClient.groups.create(ctx.shopContext, {
            code: 'viewer-group',
            title: 'Should Fail',
          }),
        );
      });

      it('viewer should NOT update group', async () => {
        const groups = await viewerClient.groups.getAll(ctx.shopContext);
        if (groups.items.length > 0) {
          const firstGroup = groups.items[0];
          if (!firstGroup) throw new Error('Expected group');
          await expectForbidden(() =>
            viewerClient.groups.update(ctx.shopContext, firstGroup.id, {
              title: 'Should Fail',
            }),
          );
        }
      });

      it('viewer should NOT delete group', async () => {
        const groups = await viewerClient.groups.getAll(ctx.shopContext);
        if (groups.items.length > 0) {
          const firstGroup = groups.items[0];
          if (!firstGroup) throw new Error('Expected group');
          await expectForbidden(() => viewerClient.groups.delete(ctx.shopContext, firstGroup.id));
        }
      });

      it('viewer should export groups', async () => {
        const exported = await viewerClient.groups.exportJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('viewer should NOT import groups', async () => {
        await expectForbidden(() =>
          viewerClient.groups.importJson(ctx.shopContext, [{ code: 'test', title: 'Should Fail' }]),
        );
      });
    });
  });
});
