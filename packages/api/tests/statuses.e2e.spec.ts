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

describe('Statuses (e2e)', () => {
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
      userEmail: `status-test-${generateUniqueId()}@example.com`,
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
      await expectUnauthorized(() => noAuthClient.statuses.getAll(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.statuses.getAll(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create status', async () => {
      const newStatus = { code: generateTestCode('status'), title: 'Test Status' };
      const status = await ctx.client.statuses.create(ctx.shopContext, newStatus);

      expect(status).toHaveProperty('id');
      expect(status.code).toBe(normalizeCode(newStatus.code));
      expect(status.title).toBe(newStatus.title);
      expect(status.shop_id).toBe(ctx.shop.id);
      expect(status.tenant_id).toBe(ctx.tenant.id);
    });

    it('should list statuses', async () => {
      await ctx.client.statuses.create(ctx.shopContext, {
        code: generateTestCode('status-list'),
        title: 'List Status',
      });

      const statuses = await ctx.client.statuses.getAll(ctx.shopContext);

      expect(Array.isArray(statuses.items)).toBe(true);
      expect(statuses.items.length).toBeGreaterThan(0);
    });

    it('should filter statuses by ids', async () => {
      const st1 = await ctx.client.statuses.create(ctx.shopContext, {
        code: generateTestCode('st-ids-1'),
        title: 'IDs Filter Status 1',
      });
      const st2 = await ctx.client.statuses.create(ctx.shopContext, {
        code: generateTestCode('st-ids-2'),
        title: 'IDs Filter Status 2',
      });

      const filtered = await ctx.client.statuses.getAll(ctx.shopContext, {
        ids: [st1.id, st2.id],
      });

      expect(filtered.items.length).toBe(2);
      expect(filtered.items.map((s) => s.id)).toContain(st1.id);
      expect(filtered.items.map((s) => s.id)).toContain(st2.id);
      expect(filtered.total).toBe(2);
    });

    it('should get status by id', async () => {
      const created = await ctx.client.statuses.create(ctx.shopContext, {
        code: generateTestCode('status-get'),
        title: 'Get Status',
      });

      const status = await ctx.client.statuses.getById(ctx.shopContext, created.id);

      expect(status.id).toBe(created.id);
    });

    it('should get status by code', async () => {
      const created = await ctx.client.statuses.create(ctx.shopContext, {
        code: generateTestCode('status-get-code'),
        title: 'Get Status Code',
      });

      const status = await ctx.client.statuses.getByCode(ctx.shopContext, created.code);

      expect(status.id).toBe(created.id);
      expect(status.code).toBe(created.code);
    });

    it('should update status', async () => {
      const created = await ctx.client.statuses.create(ctx.shopContext, {
        code: generateTestCode('status-update'),
        title: 'To Update',
      });

      const status = await ctx.client.statuses.update(ctx.shopContext, created.id, {
        title: 'Updated Status Title',
      });

      expect(status.title).toBe('Updated Status Title');
    });

    it('should return 409 on duplicate code', async () => {
      const duplicateCode = generateTestCode('status');
      await ctx.client.statuses.create(ctx.shopContext, {
        code: duplicateCode,
        title: 'First Status',
      });

      await expectConflict(() =>
        ctx.client.statuses.create(ctx.shopContext, {
          code: duplicateCode,
          title: 'Duplicate Status',
        }),
      );
    });
  });

  describe('Pagination', () => {
    const paginationItems: { id: number; code: string }[] = [];

    beforeAll(async () => {
      for (let i = 0; i < 15; i++) {
        const item = await ctx.client.statuses.create(ctx.shopContext, {
          code: generateTestCode(`pagination-status-${i.toString().padStart(2, '0')}`),
          title: `Pagination Status ${i}`,
        });
        paginationItems.push({ id: item.id, code: item.code });
      }
    });

    afterAll(async () => {
      for (const item of paginationItems) {
        try {
          await ctx.client.statuses.delete(ctx.shopContext, item.id);
        } catch {
          // Ignore errors during cleanup
        }
      }
    });

    it('should return paginated response with metadata', async () => {
      const response = await ctx.client.statuses.getAll(ctx.shopContext);

      expect(response).toHaveProperty('items');
      expect(response).toHaveProperty('total');
      expect(response).toHaveProperty('limit');
      expect(response).toHaveProperty('offset');
      expect(Array.isArray(response.items)).toBe(true);
      expect(response.offset).toBe(0);
    });

    it('should respect custom limit and offset', async () => {
      const response = await ctx.client.statuses.getAll(ctx.shopContext, { limit: 5, offset: 3 });

      expect(response.items.length).toBeLessThanOrEqual(5);
      expect(response.limit).toBe(5);
      expect(response.offset).toBe(3);
    });

    it('should return different items on different pages', async () => {
      const firstPage = await ctx.client.statuses.getAll(ctx.shopContext, { limit: 5, offset: 0 });
      const secondPage = await ctx.client.statuses.getAll(ctx.shopContext, { limit: 5, offset: 5 });

      if (firstPage.items.length > 0 && secondPage.items.length > 0) {
        const firstPageIds = firstPage.items.map((b) => b.id);
        const secondPageIds = secondPage.items.map((b) => b.id);
        const overlap = firstPageIds.filter((id) => secondPageIds.includes(id));
        expect(overlap.length).toBe(0);
      }
    });

    it('should return correct total count', async () => {
      const response = await ctx.client.statuses.getAll(ctx.shopContext, { limit: 5 });
      expect(response.total).toBeGreaterThanOrEqual(15);
    });

    it('should paginate through all items correctly', async () => {
      const pageSize = 5;
      const allItems: number[] = [];
      let offset = 0;
      let total = 0;

      do {
        const response = await ctx.client.statuses.getAll(ctx.shopContext, {
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
    it('should delete status', async () => {
      const toDelete = await ctx.client.statuses.create(ctx.shopContext, {
        code: generateTestCode('status-delete'),
        title: 'Delete Status',
      });

      await ctx.client.statuses.delete(ctx.shopContext, toDelete.id);
      await expectNotFound(() => ctx.client.statuses.getById(ctx.shopContext, toDelete.id));
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
        ctx.client.statuses.getAll({
          shop_id: otherCtx.shop.id,
          tenant_id: otherCtx.tenant.id,
        }),
      );
    });

    it('should return 403 when creating for other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.statuses.create(
          { shop_id: ctx.shop.id, tenant_id: otherCtx.tenant.id },
          { code: 'forbidden-status', title: 'Should Fail' },
        ),
      );
    });

    it('should return 404 when getting resource from other tenant', async () => {
      const otherStatus = await otherCtx.client.statuses.create(otherCtx.shopContext, {
        code: generateTestCode('other'),
        title: 'Other Status',
      });

      await expectNotFound(() => ctx.client.statuses.getById(ctx.shopContext, otherStatus.id));
      await expectForbidden(() =>
        ctx.client.statuses.getByCode(
          {
            shop_id: ctx.shop.id,
            tenant_id: otherCtx.tenant.id,
          },
          otherStatus.code,
        ),
      );
    });

    it('should allow same code in different tenants', async () => {
      const sharedCode = generateTestCode('shared');

      const status1 = await ctx.client.statuses.create(ctx.shopContext, {
        code: sharedCode,
        title: 'Status in Tenant 1',
      });
      const status2 = await otherCtx.client.statuses.create(otherCtx.shopContext, {
        code: sharedCode,
        title: 'Status in Tenant 2',
      });

      expect(status1.code).toBe(normalizeCode(sharedCode));
      expect(status2.code).toBe(normalizeCode(sharedCode));
      expect(status1.tenant_id).not.toBe(status2.tenant_id);
    });
  });

  describe('Import/Export', () => {
    it('should import statuses from JSON', async () => {
      const code1 = generateTestCode('import-json-1');
      const code2 = generateTestCode('import-json-2');
      const items = [
        { code: code1, title: 'Import JSON Status 1' },
        { code: code2, title: 'Import JSON Status 2' },
      ];

      const result = await ctx.client.statuses.importJson(ctx.shopContext, items);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      const statuses = await ctx.client.statuses.getAll(ctx.shopContext);
      const codes = statuses.items.map((s) => s.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should upsert existing statuses on import', async () => {
      const code = generateTestCode('upsert-json');

      await ctx.client.statuses.importJson(ctx.shopContext, [{ code, title: 'Original Title' }]);
      const result = await ctx.client.statuses.importJson(ctx.shopContext, [
        { code, title: 'Updated Title' },
      ]);

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should import statuses from CSV with commas', async () => {
      const code1 = generateTestCode('import-csv-1');
      const code2 = generateTestCode('import-csv-2');
      const csvContent = `code,title\n${code1},Import CSV Status 1\n${code2},Import CSV Status 2`;

      const result = await ctx.client.statuses.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const statuses = await ctx.client.statuses.getAll(ctx.shopContext);
      const codes = statuses.items.map((s) => s.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should import statuses from CSV with semicolons', async () => {
      const code1 = generateTestCode('import-semi-1');
      const code2 = generateTestCode('import-semi-2');
      const csvContent = `code;title\n${code1};Import Semicolon Status 1\n${code2};Import Semicolon Status 2`;

      const result = await ctx.client.statuses.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const statuses = await ctx.client.statuses.getAll(ctx.shopContext);
      const codes = statuses.items.map((s) => s.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should handle Cyrillic characters in CSV', async () => {
      const csvContent = `code;title\nmavyko;Мавико\nmarshall;MARSHALL\nmazda;Mazda`;

      const result = await ctx.client.statuses.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(3);
      expect(result.updated).toBe(0);

      const statuses = await ctx.client.statuses.getAll(ctx.shopContext);
      const mavyko = statuses.items.find((s) => s.code === 'mavyko');
      expect(mavyko).toBeDefined();
      expect(mavyko?.title).toBe('Мавико');
    });

    it('should export statuses to JSON', async () => {
      const code1 = generateTestCode('export-status-1');
      const code2 = generateTestCode('export-status-2');

      await ctx.client.statuses.importJson(ctx.shopContext, [
        { code: code1, title: 'Export Test Status 1' },
        { code: code2, title: 'Export Test Status 2' },
      ]);

      const exported = await ctx.client.statuses.exportJson(ctx.shopContext);

      expect(Array.isArray(exported)).toBe(true);
      const exportedCodes = exported.map((s) => s.code);
      expect(exportedCodes).toContain(normalizeCode(code1));
      expect(exportedCodes).toContain(normalizeCode(code2));

      const item = exported.find((s) => s.code === normalizeCode(code1));
      expect(item).toEqual({ code: normalizeCode(code1), title: 'Export Test Status 1' });
    });

    it('should export statuses to CSV', async () => {
      const code1 = generateTestCode('csv-export-status-1');
      const code2 = generateTestCode('csv-export-status-2');

      await ctx.client.statuses.importJson(ctx.shopContext, [
        { code: code1, title: 'CSV Export Test 1' },
        { code: code2, title: 'CSV Export Test 2' },
      ]);

      const csv = await ctx.client.statuses.exportCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('code,title');
      expect(lines.some((line) => line.includes(normalizeCode(code1)))).toBe(true);
      expect(lines.some((line) => line.includes(normalizeCode(code2)))).toBe(true);
    });

    it('should reject import with duplicate codes', async () => {
      const code = generateTestCode('dup-status');
      const csvContent = `code,title\n${code},First Status\n${code},Second Status`;

      try {
        await ctx.client.statuses.importCsv(ctx.shopContext, csvContent);
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
      const examples = await ctx.client.statuses.getExampleJson();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('code');
      expect(examples[0]).toHaveProperty('title');
    });

    it('should return CSV example', async () => {
      const csv = await ctx.client.statuses.getExampleCsv();

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

      it('editor should list statuses', async () => {
        const statuses = await editorClient.statuses.getAll(ctx.shopContext);
        expect(Array.isArray(statuses.items)).toBe(true);
      });

      it('editor should create status', async () => {
        const status = await editorClient.statuses.create(ctx.shopContext, {
          code: generateTestCode('editor-status'),
          title: 'Editor Status',
        });
        expect(status).toHaveProperty('id');
      });

      it('editor should get status by code', async () => {
        const statuses = await editorClient.statuses.getAll(ctx.shopContext);
        if (statuses.items.length === 0) throw new Error('Expected at least one status for editor');
        const firstStatus = statuses.items[0];
        if (!firstStatus) throw new Error('Expected status');
        const status = await editorClient.statuses.getByCode(ctx.shopContext, firstStatus.code);
        expect(status.id).toBe(firstStatus.id);
      });

      it('editor should update status', async () => {
        const statuses = await editorClient.statuses.getAll(ctx.shopContext);
        if (statuses.items.length > 0) {
          const firstStatus = statuses.items[0];
          if (!firstStatus) throw new Error('Expected status');
          const updated = await editorClient.statuses.update(ctx.shopContext, firstStatus.id, {
            title: 'Editor Updated',
          });
          expect(updated.title).toBe('Editor Updated');
        }
      });

      it('editor should delete status', async () => {
        const status = await editorClient.statuses.create(ctx.shopContext, {
          code: generateTestCode('editor-delete'),
          title: 'To Delete',
        });
        await editorClient.statuses.delete(ctx.shopContext, status.id);
        await expectNotFound(() => editorClient.statuses.getById(ctx.shopContext, status.id));
      });

      it('editor should import statuses', async () => {
        const result = await editorClient.statuses.importJson(ctx.shopContext, [
          { code: generateTestCode('editor-import'), title: 'Editor Import' },
        ]);
        expect(result.created).toBe(1);
      });

      it('editor should export statuses', async () => {
        const exported = await editorClient.statuses.exportJson(ctx.shopContext);
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

      it('viewer should list statuses', async () => {
        const statuses = await viewerClient.statuses.getAll(ctx.shopContext);
        expect(Array.isArray(statuses.items)).toBe(true);
      });

      it('viewer should get status by id', async () => {
        const statuses = await viewerClient.statuses.getAll(ctx.shopContext);
        if (statuses.items.length > 0) {
          const firstStatus = statuses.items[0];
          if (!firstStatus) throw new Error('Expected status');
          const status = await viewerClient.statuses.getById(ctx.shopContext, firstStatus.id);
          expect(status.id).toBe(firstStatus.id);
        }
      });

      it('viewer should get status by code', async () => {
        const statuses = await viewerClient.statuses.getAll(ctx.shopContext);
        if (statuses.items.length === 0) throw new Error('Expected at least one status for viewer');
        const firstStatus = statuses.items[0];
        if (!firstStatus) throw new Error('Expected status');
        const status = await viewerClient.statuses.getByCode(ctx.shopContext, firstStatus.code);
        expect(status.id).toBe(firstStatus.id);
      });

      it('viewer should NOT create status', async () => {
        await expectForbidden(() =>
          viewerClient.statuses.create(ctx.shopContext, {
            code: 'viewer-status',
            title: 'Should Fail',
          }),
        );
      });

      it('viewer should NOT update status', async () => {
        const statuses = await viewerClient.statuses.getAll(ctx.shopContext);
        if (statuses.items.length > 0) {
          const firstStatus = statuses.items[0];
          if (!firstStatus) throw new Error('Expected status');
          await expectForbidden(() =>
            viewerClient.statuses.update(ctx.shopContext, firstStatus.id, {
              title: 'Should Fail',
            }),
          );
        }
      });

      it('viewer should NOT delete status', async () => {
        const statuses = await viewerClient.statuses.getAll(ctx.shopContext);
        if (statuses.items.length > 0) {
          const firstStatus = statuses.items[0];
          if (!firstStatus) throw new Error('Expected status');
          await expectForbidden(() =>
            viewerClient.statuses.delete(ctx.shopContext, firstStatus.id),
          );
        }
      });

      it('viewer should export statuses', async () => {
        const exported = await viewerClient.statuses.exportJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('viewer should NOT import statuses', async () => {
        await expectForbidden(() =>
          viewerClient.statuses.importJson(ctx.shopContext, [
            { code: 'test', title: 'Should Fail' },
          ]),
        );
      });
    });
  });
});
