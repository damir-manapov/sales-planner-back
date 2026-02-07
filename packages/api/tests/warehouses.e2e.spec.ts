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

describe('Warehouses (e2e)', () => {
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
      userEmail: `warehouse-test-${generateUniqueId()}@example.com`,
      userName: 'Warehouse Test User',
    });
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.warehouses.getAll(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.warehouses.getAll(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create warehouse', async () => {
      const newWarehouse = { code: generateTestCode('warehouse'), title: 'Test Warehouse' };
      const warehouse = await ctx.client.warehouses.create(ctx.shopContext, newWarehouse);

      expect(warehouse).toHaveProperty('id');
      expect(warehouse.code).toBe(normalizeCode(newWarehouse.code));
      expect(warehouse.title).toBe(newWarehouse.title);
      expect(warehouse.shop_id).toBe(ctx.shop.id);
      expect(warehouse.tenant_id).toBe(ctx.tenant.id);
    });

    it('should list warehouses', async () => {
      await ctx.client.warehouses.create(ctx.shopContext, {
        code: generateTestCode('warehouse-list'),
        title: 'List Warehouse',
      });

      const warehouses = await ctx.client.warehouses.getAll(ctx.shopContext);

      expect(Array.isArray(warehouses.items)).toBe(true);
      expect(warehouses.items.length).toBeGreaterThan(0);
    });

    it('should get warehouse by id', async () => {
      const created = await ctx.client.warehouses.create(ctx.shopContext, {
        code: generateTestCode('warehouse-get'),
        title: 'Get Warehouse',
      });

      const warehouse = await ctx.client.warehouses.getById(ctx.shopContext, created.id);

      expect(warehouse.id).toBe(created.id);
    });

    it('should get warehouse by code', async () => {
      const created = await ctx.client.warehouses.create(ctx.shopContext, {
        code: generateTestCode('warehouse-get-code'),
        title: 'Get Warehouse Code',
      });

      const warehouse = await ctx.client.warehouses.getByCode(ctx.shopContext, created.code);

      expect(warehouse.id).toBe(created.id);
      expect(warehouse.code).toBe(created.code);
    });

    it('should update warehouse', async () => {
      const created = await ctx.client.warehouses.create(ctx.shopContext, {
        code: generateTestCode('warehouse-update'),
        title: 'To Update',
      });

      const warehouse = await ctx.client.warehouses.update(ctx.shopContext, created.id, {
        title: 'Updated Warehouse Title',
      });

      expect(warehouse.title).toBe('Updated Warehouse Title');
    });

    it('should return 409 on duplicate code', async () => {
      const duplicateCode = generateTestCode('warehouse');
      await ctx.client.warehouses.create(ctx.shopContext, {
        code: duplicateCode,
        title: 'First Warehouse',
      });

      await expectConflict(() =>
        ctx.client.warehouses.create(ctx.shopContext, {
          code: duplicateCode,
          title: 'Duplicate Warehouse',
        }),
      );
    });
  });

  describe('Pagination', () => {
    const paginationItems: { id: number; code: string }[] = [];

    beforeAll(async () => {
      for (let i = 0; i < 15; i++) {
        const item = await ctx.client.warehouses.create(ctx.shopContext, {
          code: generateTestCode(`pagination-warehouse-${i.toString().padStart(2, '0')}`),
          title: `Pagination Warehouse ${i}`,
        });
        paginationItems.push({ id: item.id, code: item.code });
      }
    });

    afterAll(async () => {
      for (const item of paginationItems) {
        try {
          await ctx.client.warehouses.delete(ctx.shopContext, item.id);
        } catch {
          // Ignore errors during cleanup
        }
      }
    });

    it('should return paginated response with metadata', async () => {
      const response = await ctx.client.warehouses.getAll(ctx.shopContext);

      expect(response).toHaveProperty('items');
      expect(response).toHaveProperty('total');
      expect(response).toHaveProperty('limit');
      expect(response).toHaveProperty('offset');
      expect(Array.isArray(response.items)).toBe(true);
      expect(response.offset).toBe(0);
    });

    it('should respect custom limit and offset', async () => {
      const response = await ctx.client.warehouses.getAll(ctx.shopContext, { limit: 5, offset: 3 });

      expect(response.items.length).toBeLessThanOrEqual(5);
      expect(response.limit).toBe(5);
      expect(response.offset).toBe(3);
    });

    it('should return different items on different pages', async () => {
      const firstPage = await ctx.client.warehouses.getAll(ctx.shopContext, {
        limit: 5,
        offset: 0,
      });
      const secondPage = await ctx.client.warehouses.getAll(ctx.shopContext, {
        limit: 5,
        offset: 5,
      });

      if (firstPage.items.length > 0 && secondPage.items.length > 0) {
        const firstPageIds = firstPage.items.map((b) => b.id);
        const secondPageIds = secondPage.items.map((b) => b.id);
        const overlap = firstPageIds.filter((id) => secondPageIds.includes(id));
        expect(overlap.length).toBe(0);
      }
    });

    it('should return correct total count', async () => {
      const response = await ctx.client.warehouses.getAll(ctx.shopContext, { limit: 5 });
      expect(response.total).toBeGreaterThanOrEqual(15);
    });

    it('should paginate through all items correctly', async () => {
      const pageSize = 5;
      const allItems: number[] = [];
      let offset = 0;
      let total = 0;

      do {
        const response = await ctx.client.warehouses.getAll(ctx.shopContext, {
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
    it('should delete warehouse', async () => {
      const toDelete = await ctx.client.warehouses.create(ctx.shopContext, {
        code: generateTestCode('warehouse-delete'),
        title: 'Delete Warehouse',
      });

      await ctx.client.warehouses.delete(ctx.shopContext, toDelete.id);
      await expectNotFound(() => ctx.client.warehouses.getById(ctx.shopContext, toDelete.id));
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
        ctx.client.warehouses.getAll({
          shop_id: otherCtx.shop.id,
          tenant_id: otherCtx.tenant.id,
        }),
      );
    });

    it('should return 403 when creating for other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.warehouses.create(
          { shop_id: ctx.shop.id, tenant_id: otherCtx.tenant.id },
          { code: 'forbidden-warehouse', title: 'Should Fail' },
        ),
      );
    });

    it('should return 404 when getting resource from other tenant', async () => {
      const otherWarehouse = await otherCtx.client.warehouses.create(otherCtx.shopContext, {
        code: generateTestCode('other'),
        title: 'Other Warehouse',
      });

      await expectNotFound(() => ctx.client.warehouses.getById(ctx.shopContext, otherWarehouse.id));
      await expectForbidden(() =>
        ctx.client.warehouses.getByCode(
          {
            shop_id: ctx.shop.id,
            tenant_id: otherCtx.tenant.id,
          },
          otherWarehouse.code,
        ),
      );
    });

    it('should allow same code in different tenants', async () => {
      const sharedCode = generateTestCode('shared');

      const warehouse1 = await ctx.client.warehouses.create(ctx.shopContext, {
        code: sharedCode,
        title: 'Warehouse in Tenant 1',
      });
      const warehouse2 = await otherCtx.client.warehouses.create(otherCtx.shopContext, {
        code: sharedCode,
        title: 'Warehouse in Tenant 2',
      });

      expect(warehouse1.code).toBe(normalizeCode(sharedCode));
      expect(warehouse2.code).toBe(normalizeCode(sharedCode));
      expect(warehouse1.tenant_id).not.toBe(warehouse2.tenant_id);
    });
  });

  describe('Import/Export', () => {
    it('should import warehouses from JSON', async () => {
      const code1 = generateTestCode('import-json-1');
      const code2 = generateTestCode('import-json-2');
      const items = [
        { code: code1, title: 'Import JSON Warehouse 1' },
        { code: code2, title: 'Import JSON Warehouse 2' },
      ];

      const result = await ctx.client.warehouses.importJson(ctx.shopContext, items);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      const warehouses = await ctx.client.warehouses.getAll(ctx.shopContext);
      const codes = warehouses.items.map((s) => s.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should upsert existing warehouses on import', async () => {
      const code = generateTestCode('upsert-json');

      await ctx.client.warehouses.importJson(ctx.shopContext, [{ code, title: 'Original Title' }]);
      const result = await ctx.client.warehouses.importJson(ctx.shopContext, [
        { code, title: 'Updated Title' },
      ]);

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should import warehouses from CSV with commas', async () => {
      const code1 = generateTestCode('import-csv-1');
      const code2 = generateTestCode('import-csv-2');
      const csvContent = `code,title\n${code1},Import CSV Warehouse 1\n${code2},Import CSV Warehouse 2`;

      const result = await ctx.client.warehouses.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const warehouses = await ctx.client.warehouses.getAll(ctx.shopContext);
      const codes = warehouses.items.map((s) => s.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should import warehouses from CSV with semicolons', async () => {
      const code1 = generateTestCode('import-semi-1');
      const code2 = generateTestCode('import-semi-2');
      const csvContent = `code;title\n${code1};Import Semicolon Warehouse 1\n${code2};Import Semicolon Warehouse 2`;

      const result = await ctx.client.warehouses.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const warehouses = await ctx.client.warehouses.getAll(ctx.shopContext);
      const codes = warehouses.items.map((s) => s.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should handle Cyrillic characters in CSV', async () => {
      const csvContent = `code;title\nozon;Озон\nwb;Wildberries\nff;Фулфилмент`;

      const result = await ctx.client.warehouses.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(3);
      expect(result.updated).toBe(0);

      const warehouses = await ctx.client.warehouses.getAll(ctx.shopContext);
      const ozon = warehouses.items.find((s) => s.code === 'ozon');
      expect(ozon).toBeDefined();
      expect(ozon?.title).toBe('Озон');
    });

    it('should export warehouses to JSON', async () => {
      const code1 = generateTestCode('export-warehouse-1');
      const code2 = generateTestCode('export-warehouse-2');

      await ctx.client.warehouses.importJson(ctx.shopContext, [
        { code: code1, title: 'Export Test Warehouse 1' },
        { code: code2, title: 'Export Test Warehouse 2' },
      ]);

      const exported = await ctx.client.warehouses.exportJson(ctx.shopContext);

      expect(Array.isArray(exported)).toBe(true);
      const exportedCodes = exported.map((s) => s.code);
      expect(exportedCodes).toContain(normalizeCode(code1));
      expect(exportedCodes).toContain(normalizeCode(code2));

      const item = exported.find((s) => s.code === normalizeCode(code1));
      expect(item).toEqual({ code: normalizeCode(code1), title: 'Export Test Warehouse 1' });
    });

    it('should export warehouses to CSV', async () => {
      const code1 = generateTestCode('csv-export-warehouse-1');
      const code2 = generateTestCode('csv-export-warehouse-2');

      await ctx.client.warehouses.importJson(ctx.shopContext, [
        { code: code1, title: 'CSV Export Test 1' },
        { code: code2, title: 'CSV Export Test 2' },
      ]);

      const csv = await ctx.client.warehouses.exportCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('code,title');
      expect(lines.some((line) => line.includes(normalizeCode(code1)))).toBe(true);
      expect(lines.some((line) => line.includes(normalizeCode(code2)))).toBe(true);
    });

    it('should reject import with duplicate codes', async () => {
      const code = generateTestCode('dup-warehouse');
      const csvContent = `code,title\n${code},First Warehouse\n${code},Second Warehouse`;

      try {
        await ctx.client.warehouses.importCsv(ctx.shopContext, csvContent);
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
      const examples = await ctx.client.warehouses.getExampleJson();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('code');
      expect(examples[0]).toHaveProperty('title');
    });

    it('should return CSV example', async () => {
      const csv = await ctx.client.warehouses.getExampleCsv();

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

      it('editor should list warehouses', async () => {
        const warehouses = await editorClient.warehouses.getAll(ctx.shopContext);
        expect(Array.isArray(warehouses.items)).toBe(true);
      });

      it('editor should create warehouse', async () => {
        const warehouse = await editorClient.warehouses.create(ctx.shopContext, {
          code: generateTestCode('editor-warehouse'),
          title: 'Editor Warehouse',
        });
        expect(warehouse).toHaveProperty('id');
      });

      it('editor should get warehouse by code', async () => {
        const warehouses = await editorClient.warehouses.getAll(ctx.shopContext);
        if (warehouses.items.length === 0)
          throw new Error('Expected at least one warehouse for editor');
        const firstWarehouse = warehouses.items[0];
        if (!firstWarehouse) throw new Error('Expected warehouse');
        const warehouse = await editorClient.warehouses.getByCode(
          ctx.shopContext,
          firstWarehouse.code,
        );
        expect(warehouse.id).toBe(firstWarehouse.id);
      });

      it('editor should update warehouse', async () => {
        const warehouses = await editorClient.warehouses.getAll(ctx.shopContext);
        if (warehouses.items.length > 0) {
          const firstWarehouse = warehouses.items[0];
          if (!firstWarehouse) throw new Error('Expected warehouse');
          const updated = await editorClient.warehouses.update(ctx.shopContext, firstWarehouse.id, {
            title: 'Editor Updated',
          });
          expect(updated.title).toBe('Editor Updated');
        }
      });

      it('editor should delete warehouse', async () => {
        const warehouse = await editorClient.warehouses.create(ctx.shopContext, {
          code: generateTestCode('editor-delete'),
          title: 'To Delete',
        });
        await editorClient.warehouses.delete(ctx.shopContext, warehouse.id);
        await expectNotFound(() => editorClient.warehouses.getById(ctx.shopContext, warehouse.id));
      });

      it('editor should import warehouses', async () => {
        const result = await editorClient.warehouses.importJson(ctx.shopContext, [
          { code: generateTestCode('editor-import'), title: 'Editor Import' },
        ]);
        expect(result.created).toBe(1);
      });

      it('editor should export warehouses', async () => {
        const exported = await editorClient.warehouses.exportJson(ctx.shopContext);
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

      it('viewer should list warehouses', async () => {
        const warehouses = await viewerClient.warehouses.getAll(ctx.shopContext);
        expect(Array.isArray(warehouses.items)).toBe(true);
      });

      it('viewer should get warehouse by id', async () => {
        const warehouses = await viewerClient.warehouses.getAll(ctx.shopContext);
        if (warehouses.items.length > 0) {
          const firstWarehouse = warehouses.items[0];
          if (!firstWarehouse) throw new Error('Expected warehouse');
          const warehouse = await viewerClient.warehouses.getById(
            ctx.shopContext,
            firstWarehouse.id,
          );
          expect(warehouse.id).toBe(firstWarehouse.id);
        }
      });

      it('viewer should get warehouse by code', async () => {
        const warehouses = await viewerClient.warehouses.getAll(ctx.shopContext);
        if (warehouses.items.length === 0)
          throw new Error('Expected at least one warehouse for viewer');
        const firstWarehouse = warehouses.items[0];
        if (!firstWarehouse) throw new Error('Expected warehouse');
        const warehouse = await viewerClient.warehouses.getByCode(
          ctx.shopContext,
          firstWarehouse.code,
        );
        expect(warehouse.id).toBe(firstWarehouse.id);
      });

      it('viewer should NOT create warehouse', async () => {
        await expectForbidden(() =>
          viewerClient.warehouses.create(ctx.shopContext, {
            code: 'viewer-warehouse',
            title: 'Should Fail',
          }),
        );
      });

      it('viewer should NOT update warehouse', async () => {
        const warehouses = await viewerClient.warehouses.getAll(ctx.shopContext);
        if (warehouses.items.length > 0) {
          const firstWarehouse = warehouses.items[0];
          if (!firstWarehouse) throw new Error('Expected warehouse');
          await expectForbidden(() =>
            viewerClient.warehouses.update(ctx.shopContext, firstWarehouse.id, {
              title: 'Should Fail',
            }),
          );
        }
      });

      it('viewer should NOT delete warehouse', async () => {
        const warehouses = await viewerClient.warehouses.getAll(ctx.shopContext);
        if (warehouses.items.length > 0) {
          const firstWarehouse = warehouses.items[0];
          if (!firstWarehouse) throw new Error('Expected warehouse');
          await expectForbidden(() =>
            viewerClient.warehouses.delete(ctx.shopContext, firstWarehouse.id),
          );
        }
      });

      it('viewer should export warehouses', async () => {
        const exported = await viewerClient.warehouses.exportJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('viewer should NOT import warehouses', async () => {
        await expectForbidden(() =>
          viewerClient.warehouses.importJson(ctx.shopContext, [
            { code: 'test', title: 'Should Fail' },
          ]),
        );
      });
    });
  });
});
