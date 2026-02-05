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

describe('Statuses (e2e)', () => {
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
      await expectUnauthorized(() => noAuthClient.getStatuses(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.getStatuses(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create status', async () => {
      const newStatus = { code: generateTestCode('status'), title: 'Test Status' };
      const status = await ctx.client.createStatus(newStatus, ctx.shopContext);

      expect(status).toHaveProperty('id');
      expect(status.code).toBe(normalizeCode(newStatus.code));
      expect(status.title).toBe(newStatus.title);
      expect(status.shop_id).toBe(ctx.shop.id);
      expect(status.tenant_id).toBe(ctx.tenant.id);

      statusId = status.id;
    });

    it('should list statuses', async () => {
      const statuses = await ctx.client.getStatuses(ctx.shopContext);

      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBeGreaterThan(0);
    });

    it('should get status by id', async () => {
      const status = await ctx.client.getStatus(statusId, ctx.shopContext);

      expect(status.id).toBe(statusId);
    });

    it('should update status', async () => {
      const status = await ctx.client.updateStatus(
        statusId,
        { title: 'Updated Status Title' },
        ctx.shopContext,
      );

      expect(status.title).toBe('Updated Status Title');
    });

    it('should return 409 on duplicate code', async () => {
      const duplicateCode = generateTestCode('status');
      await ctx.client.createStatus(
        { code: duplicateCode, title: 'First Status' },
        ctx.shopContext,
      );

      await expectConflict(() =>
        ctx.client.createStatus(
          { code: duplicateCode, title: 'Duplicate Status' },
          ctx.shopContext,
        ),
      );
    });
  });

  describe('Delete operations', () => {
    it('should delete status', async () => {
      await ctx.client.deleteStatus(statusId, ctx.shopContext);
      await expectNotFound(() => ctx.client.getStatus(statusId, ctx.shopContext));
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
        ctx.client.getStatuses({
          shop_id: otherCtx.shop.id,
          tenant_id: otherCtx.tenant.id,
        }),
      );
    });

    it('should return 403 when creating for other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.createStatus(
          { code: 'forbidden-status', title: 'Should Fail' },
          { shop_id: ctx.shop.id, tenant_id: otherCtx.tenant.id },
        ),
      );
    });

    it('should return 404 when getting resource from other tenant', async () => {
      const otherStatus = await otherCtx.client.createStatus(
        { code: generateTestCode('other'), title: 'Other Status' },
        otherCtx.shopContext,
      );

      await expectNotFound(() => ctx.client.getStatus(otherStatus.id, ctx.shopContext));
    });

    it('should allow same code in different tenants', async () => {
      const sharedCode = generateTestCode('shared');

      const status1 = await ctx.client.createStatus(
        { code: sharedCode, title: 'Status in Tenant 1' },
        ctx.shopContext,
      );
      const status2 = await otherCtx.client.createStatus(
        { code: sharedCode, title: 'Status in Tenant 2' },
        otherCtx.shopContext,
      );

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

      const result = await ctx.client.importStatusesJson(items, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      const statuses = await ctx.client.getStatuses(ctx.shopContext);
      const codes = statuses.map((s) => s.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should upsert existing statuses on import', async () => {
      const code = generateTestCode('upsert-json');

      await ctx.client.importStatusesJson([{ code, title: 'Original Title' }], ctx.shopContext);
      const result = await ctx.client.importStatusesJson(
        [{ code, title: 'Updated Title' }],
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should import statuses from CSV with commas', async () => {
      const code1 = generateTestCode('import-csv-1');
      const code2 = generateTestCode('import-csv-2');
      const csvContent = `code,title\n${code1},Import CSV Status 1\n${code2},Import CSV Status 2`;

      const result = await ctx.client.importStatusesCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const statuses = await ctx.client.getStatuses(ctx.shopContext);
      const codes = statuses.map((s) => s.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should import statuses from CSV with semicolons', async () => {
      const code1 = generateTestCode('import-semi-1');
      const code2 = generateTestCode('import-semi-2');
      const csvContent = `code;title\n${code1};Import Semicolon Status 1\n${code2};Import Semicolon Status 2`;

      const result = await ctx.client.importStatusesCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const statuses = await ctx.client.getStatuses(ctx.shopContext);
      const codes = statuses.map((s) => s.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should handle Cyrillic characters in CSV', async () => {
      const csvContent = `code;title\nmavyko;Мавико\nmarshall;MARSHALL\nmazda;Mazda`;

      const result = await ctx.client.importStatusesCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(3);
      expect(result.updated).toBe(0);

      const statuses = await ctx.client.getStatuses(ctx.shopContext);
      const mavyko = statuses.find((s) => s.code === 'mavyko');
      expect(mavyko).toBeDefined();
      expect(mavyko?.title).toBe('Мавико');
    });

    it('should export statuses to JSON', async () => {
      const code1 = generateTestCode('export-status-1');
      const code2 = generateTestCode('export-status-2');

      await ctx.client.importStatusesJson(
        [
          { code: code1, title: 'Export Test Status 1' },
          { code: code2, title: 'Export Test Status 2' },
        ],
        ctx.shopContext,
      );

      const exported = await ctx.client.exportStatusesJson(ctx.shopContext);

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
      expect(lines.some((line) => line.includes(normalizeCode(code1)))).toBe(true);
      expect(lines.some((line) => line.includes(normalizeCode(code2)))).toBe(true);
    });
  });

  describe('Example downloads', () => {
    it('should return JSON example', async () => {
      const examples = await ctx.client.getStatusesExampleJson();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('code');
      expect(examples[0]).toHaveProperty('title');
    });

    it('should return CSV example', async () => {
      const csv = await ctx.client.getStatusesExampleCsv();

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

      it('editor should list statuses', async () => {
        const statuses = await editorClient.getStatuses(ctx.shopContext);
        expect(Array.isArray(statuses)).toBe(true);
      });

      it('editor should create status', async () => {
        const status = await editorClient.createStatus(
          { code: generateTestCode('editor-status'), title: 'Editor Status' },
          ctx.shopContext,
        );
        expect(status).toHaveProperty('id');
      });

      it('editor should update status', async () => {
        const statuses = await editorClient.getStatuses(ctx.shopContext);
        if (statuses.length > 0) {
          const firstStatus = statuses[0];
          if (!firstStatus) throw new Error('Expected status');
          const updated = await editorClient.updateStatus(
            firstStatus.id,
            { title: 'Editor Updated' },
            ctx.shopContext,
          );
          expect(updated.title).toBe('Editor Updated');
        }
      });

      it('editor should delete status', async () => {
        const status = await editorClient.createStatus(
          { code: generateTestCode('editor-delete'), title: 'To Delete' },
          ctx.shopContext,
        );
        await editorClient.deleteStatus(status.id, ctx.shopContext);
        await expectNotFound(() => editorClient.getStatus(status.id, ctx.shopContext));
      });

      it('editor should import statuses', async () => {
        const result = await editorClient.importStatusesJson(
          [{ code: generateTestCode('editor-import'), title: 'Editor Import' }],
          ctx.shopContext,
        );
        expect(result.created).toBe(1);
      });

      it('editor should export statuses', async () => {
        const exported = await editorClient.exportStatusesJson(ctx.shopContext);
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

      it('viewer should list statuses', async () => {
        const statuses = await viewerClient.getStatuses(ctx.shopContext);
        expect(Array.isArray(statuses)).toBe(true);
      });

      it('viewer should get status by id', async () => {
        const statuses = await viewerClient.getStatuses(ctx.shopContext);
        if (statuses.length > 0) {
          const firstStatus = statuses[0];
          if (!firstStatus) throw new Error('Expected status');
          const status = await viewerClient.getStatus(firstStatus.id, ctx.shopContext);
          expect(status.id).toBe(firstStatus.id);
        }
      });

      it('viewer should NOT create status', async () => {
        await expectForbidden(() =>
          viewerClient.createStatus(
            { code: 'viewer-status', title: 'Should Fail' },
            ctx.shopContext,
          ),
        );
      });

      it('viewer should NOT update status', async () => {
        const statuses = await viewerClient.getStatuses(ctx.shopContext);
        if (statuses.length > 0) {
          const firstStatus = statuses[0];
          if (!firstStatus) throw new Error('Expected status');
          await expectForbidden(() =>
            viewerClient.updateStatus(firstStatus.id, { title: 'Should Fail' }, ctx.shopContext),
          );
        }
      });

      it('viewer should NOT delete status', async () => {
        const statuses = await viewerClient.getStatuses(ctx.shopContext);
        if (statuses.length > 0) {
          const firstStatus = statuses[0];
          if (!firstStatus) throw new Error('Expected status');
          await expectForbidden(() => viewerClient.deleteStatus(firstStatus.id, ctx.shopContext));
        }
      });

      it('viewer should export statuses', async () => {
        const exported = await viewerClient.exportStatusesJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('viewer should NOT import statuses', async () => {
        await expectForbidden(() =>
          viewerClient.importStatusesJson(
            [{ code: 'test', title: 'Should Fail' }],
            ctx.shopContext,
          ),
        );
      });
    });
  });
});
