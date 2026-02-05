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

describe('Suppliers (e2e)', () => {
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
      userEmail: `supplier-test-${generateUniqueId()}@example.com`,
      userName: 'Supplier Test User',
    });
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.suppliers.getSuppliers(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.suppliers.getSuppliers(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create supplier', async () => {
      const newSupplier = { code: generateTestCode('supplier'), title: 'Test Supplier' };
      const supplier = await ctx.client.suppliers.createSupplier(ctx.shopContext, newSupplier);

      expect(supplier).toHaveProperty('id');
      expect(supplier.code).toBe(normalizeCode(newSupplier.code));
      expect(supplier.title).toBe(newSupplier.title);
      expect(supplier.shop_id).toBe(ctx.shop.id);
      expect(supplier.tenant_id).toBe(ctx.tenant.id);
    });

    it('should list suppliers', async () => {
      await ctx.client.suppliers.createSupplier(ctx.shopContext, {
        code: generateTestCode('supplier-list'),
        title: 'List Supplier',
      });

      const suppliers = await ctx.client.suppliers.getSuppliers(ctx.shopContext);

      expect(Array.isArray(suppliers)).toBe(true);
      expect(suppliers.length).toBeGreaterThan(0);
    });

    it('should get supplier by id', async () => {
      const created = await ctx.client.suppliers.createSupplier(ctx.shopContext, {
        code: generateTestCode('supplier-get'),
        title: 'Get Supplier',
      });

      const supplier = await ctx.client.suppliers.getSupplier(ctx.shopContext, created.id);

      expect(supplier.id).toBe(created.id);
    });

    it('should get supplier by code', async () => {
      const created = await ctx.client.suppliers.createSupplier(ctx.shopContext, {
        code: generateTestCode('supplier-get-code'),
        title: 'Get Supplier Code',
      });

      const supplier = await ctx.client.suppliers.getSupplierByCode(ctx.shopContext, created.code);

      expect(supplier.id).toBe(created.id);
      expect(supplier.code).toBe(created.code);
    });

    it('should update supplier', async () => {
      const created = await ctx.client.suppliers.createSupplier(ctx.shopContext, {
        code: generateTestCode('supplier-update'),
        title: 'To Update',
      });

      const supplier = await ctx.client.suppliers.updateSupplier(ctx.shopContext, created.id, {
        title: 'Updated Supplier Title',
      });

      expect(supplier.title).toBe('Updated Supplier Title');
    });

    it('should return 409 on duplicate code', async () => {
      const duplicateCode = generateTestCode('supplier');
      await ctx.client.suppliers.createSupplier(ctx.shopContext, {
        code: duplicateCode,
        title: 'First Supplier',
      });

      await expectConflict(() =>
        ctx.client.suppliers.createSupplier(ctx.shopContext, {
          code: duplicateCode,
          title: 'Duplicate Supplier',
        }),
      );
    });

    it('should return 404 for non-existent supplier', async () => {
      await expectNotFound(() => ctx.client.suppliers.getSupplier(ctx.shopContext, 999999));
    });
  });

  describe('Delete operations', () => {
    it('should delete supplier', async () => {
      const toDelete = await ctx.client.suppliers.createSupplier(ctx.shopContext, {
        code: generateTestCode('supplier-delete'),
        title: 'Delete Supplier',
      });

      await ctx.client.suppliers.deleteSupplier(ctx.shopContext, toDelete.id);
      await expectNotFound(() => ctx.client.suppliers.getSupplier(ctx.shopContext, toDelete.id));
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
        ctx.client.suppliers.getSuppliers({
          shop_id: otherCtx.shop.id,
          tenant_id: otherCtx.tenant.id,
        }),
      );
    });

    it('should return 403 when creating for other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.suppliers.createSupplier(
          { shop_id: ctx.shop.id, tenant_id: otherCtx.tenant.id },
          { code: 'forbidden-supplier', title: 'Should Fail' },
        ),
      );
    });

    it('should return 404 when getting resource from other tenant', async () => {
      const otherSupplier = await otherCtx.client.suppliers.createSupplier(otherCtx.shopContext, {
        code: generateTestCode('other'),
        title: 'Other Supplier',
      });

      await expectNotFound(() =>
        ctx.client.suppliers.getSupplier(ctx.shopContext, otherSupplier.id),
      );
      await expectForbidden(() =>
        ctx.client.suppliers.getSupplierByCode(
          {
            shop_id: ctx.shop.id,
            tenant_id: otherCtx.tenant.id,
          },
          otherSupplier.code,
        ),
      );
    });

    it('should allow same code in different tenants', async () => {
      const sharedCode = generateTestCode('shared');

      const supplier1 = await ctx.client.suppliers.createSupplier(ctx.shopContext, {
        code: sharedCode,
        title: 'Supplier in Tenant 1',
      });
      const supplier2 = await otherCtx.client.suppliers.createSupplier(otherCtx.shopContext, {
        code: sharedCode,
        title: 'Supplier in Tenant 2',
      });

      expect(supplier1.code).toBe(normalizeCode(sharedCode));
      expect(supplier2.code).toBe(normalizeCode(sharedCode));
      expect(supplier1.tenant_id).not.toBe(supplier2.tenant_id);
    });
  });

  describe('Import/Export', () => {
    it('should import suppliers from JSON', async () => {
      const code1 = generateTestCode('import-json-1');
      const code2 = generateTestCode('import-json-2');

      const result = await ctx.client.suppliers.importJson(ctx.shopContext, [
        { code: code1, title: 'Import JSON Supplier 1' },
        { code: code2, title: 'Import JSON Supplier 2' },
      ]);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);

      const suppliers = await ctx.client.suppliers.getSuppliers(ctx.shopContext);
      const codes = suppliers.map((s) => s.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should upsert existing suppliers on import', async () => {
      const code = generateTestCode('upsert-json');

      await ctx.client.suppliers.importJson(ctx.shopContext, [{ code, title: 'Original Title' }]);
      const result = await ctx.client.suppliers.importJson(ctx.shopContext, [
        { code, title: 'Updated Title' },
      ]);

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should import suppliers from CSV', async () => {
      const code1 = generateTestCode('import-csv-1');
      const code2 = generateTestCode('import-csv-2');
      const csvContent = `code,title\n${code1},Import CSV Supplier 1\n${code2},Import CSV Supplier 2`;

      const result = await ctx.client.suppliers.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const suppliers = await ctx.client.suppliers.getSuppliers(ctx.shopContext);
      const codes = suppliers.map((s) => s.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should export suppliers to JSON', async () => {
      const code1 = generateTestCode('export-supplier-1');
      const code2 = generateTestCode('export-supplier-2');

      await ctx.client.suppliers.importJson(ctx.shopContext, [
        { code: code1, title: 'Export Test Supplier 1' },
        { code: code2, title: 'Export Test Supplier 2' },
      ]);

      const exported = await ctx.client.suppliers.exportJson(ctx.shopContext);

      expect(Array.isArray(exported)).toBe(true);
      const exportedCodes = exported.map((s) => s.code);
      expect(exportedCodes).toContain(normalizeCode(code1));
      expect(exportedCodes).toContain(normalizeCode(code2));
    });

    it('should export suppliers to CSV', async () => {
      const code1 = generateTestCode('csv-export-supplier-1');
      const code2 = generateTestCode('csv-export-supplier-2');

      await ctx.client.suppliers.importJson(ctx.shopContext, [
        { code: code1, title: 'CSV Export Test 1' },
        { code: code2, title: 'CSV Export Test 2' },
      ]);

      const csv = await ctx.client.suppliers.exportCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('code,title');
      expect(csv).toContain(normalizeCode(code1));
      expect(csv).toContain(normalizeCode(code2));
    });
  });

  describe('Example downloads', () => {
    it('should return JSON example', async () => {
      const examples = await ctx.client.suppliers.getExampleJson();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('code');
      expect(examples[0]).toHaveProperty('title');
    });

    it('should return CSV example', async () => {
      const csv = await ctx.client.suppliers.getExampleCsv();

      expect(typeof csv).toBe('string');
      expect(csv).toContain('code,title');
    });
  });

  describe('Role-based access', () => {
    describe('Editor role', () => {
      let editorUserId: number;
      let editorClient: SalesPlannerClient;

      beforeAll(async () => {
        const editorUser = await ctx.getSystemClient().users.createUser({
          email: `editor-${generateUniqueId()}@example.com`,
          name: 'Editor User',
        });
        editorUserId = editorUser.id;

        const editorApiKey = await ctx.getSystemClient().apiKeys.createApiKey({
          user_id: editorUserId,
          name: 'Editor Key',
        });
        editorClient = new SalesPlannerClient({ baseUrl, apiKey: editorApiKey.key });

        const roles = await ctx.getSystemClient().roles.getRoles();
        const editorRole = roles.find((r) => r.name === ROLE_NAMES.EDITOR);
        if (!editorRole) throw new Error('Editor role not found');
        await ctx.getSystemClient().userRoles.createUserRole({
          user_id: editorUserId,
          role_id: editorRole.id,
          tenant_id: ctx.tenant.id,
          shop_id: ctx.shop.id,
        });
      });

      afterAll(async () => {
        if (editorUserId) await cleanupUser(app, editorUserId);
      });

      it('editor should list suppliers', async () => {
        const suppliers = await editorClient.suppliers.getSuppliers(ctx.shopContext);
        expect(Array.isArray(suppliers)).toBe(true);
      });

      it('editor should create supplier', async () => {
        const supplier = await editorClient.suppliers.createSupplier(ctx.shopContext, {
          code: generateTestCode('editor-supplier'),
          title: 'Editor Supplier',
        });
        expect(supplier).toHaveProperty('id');
      });

      it('editor should get supplier by code', async () => {
        const suppliers = await editorClient.suppliers.getSuppliers(ctx.shopContext);
        if (suppliers.length === 0) throw new Error('Expected at least one supplier for editor');
        const firstSupplier = suppliers[0];
        if (!firstSupplier) throw new Error('Expected supplier');
        const supplier = await editorClient.suppliers.getSupplierByCode(
          ctx.shopContext,
          firstSupplier.code,
        );
        expect(supplier.id).toBe(firstSupplier.id);
      });

      it('editor should update supplier', async () => {
        const suppliers = await editorClient.suppliers.getSuppliers(ctx.shopContext);
        if (suppliers.length > 0) {
          const firstSupplier = suppliers[0];
          if (!firstSupplier) throw new Error('Expected supplier');
          const updated = await editorClient.suppliers.updateSupplier(
            ctx.shopContext,
            firstSupplier.id,
            { title: 'Editor Updated' },
          );
          expect(updated.title).toBe('Editor Updated');
        }
      });

      it('editor should delete supplier', async () => {
        const supplier = await editorClient.suppliers.createSupplier(ctx.shopContext, {
          code: generateTestCode('editor-delete'),
          title: 'To Delete',
        });
        await editorClient.suppliers.deleteSupplier(ctx.shopContext, supplier.id);
        await expectNotFound(() =>
          editorClient.suppliers.getSupplier(ctx.shopContext, supplier.id),
        );
      });

      it('editor should import suppliers', async () => {
        const result = await editorClient.suppliers.importJson(ctx.shopContext, [
          { code: generateTestCode('editor-import'), title: 'Editor Import' },
        ]);
        expect(result.created).toBe(1);
      });

      it('editor should export suppliers', async () => {
        const exported = await editorClient.suppliers.exportJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });
    });

    describe('Viewer role', () => {
      let viewerUserId: number;
      let viewerClient: SalesPlannerClient;

      beforeAll(async () => {
        const viewerUser = await ctx.getSystemClient().users.createUser({
          email: `viewer-${generateUniqueId()}@example.com`,
          name: 'Viewer User',
        });
        viewerUserId = viewerUser.id;

        const viewerApiKey = await ctx.getSystemClient().apiKeys.createApiKey({
          user_id: viewerUserId,
          name: 'Viewer Key',
        });
        viewerClient = new SalesPlannerClient({ baseUrl, apiKey: viewerApiKey.key });

        const roles = await ctx.getSystemClient().roles.getRoles();
        const viewerRole = roles.find((r) => r.name === ROLE_NAMES.VIEWER);
        if (!viewerRole) throw new Error('Viewer role not found');
        await ctx.getSystemClient().userRoles.createUserRole({
          user_id: viewerUserId,
          role_id: viewerRole.id,
          tenant_id: ctx.tenant.id,
          shop_id: ctx.shop.id,
        });
      });

      afterAll(async () => {
        if (viewerUserId) await cleanupUser(app, viewerUserId);
      });

      it('viewer should list suppliers', async () => {
        const suppliers = await viewerClient.suppliers.getSuppliers(ctx.shopContext);
        expect(Array.isArray(suppliers)).toBe(true);
      });

      it('viewer should get supplier by id', async () => {
        const suppliers = await viewerClient.suppliers.getSuppliers(ctx.shopContext);
        if (suppliers.length > 0) {
          const firstSupplier = suppliers[0];
          if (!firstSupplier) throw new Error('Expected supplier');
          const supplier = await viewerClient.suppliers.getSupplier(
            ctx.shopContext,
            firstSupplier.id,
          );
          expect(supplier.id).toBe(firstSupplier.id);
        }
      });

      it('viewer should get supplier by code', async () => {
        const suppliers = await viewerClient.suppliers.getSuppliers(ctx.shopContext);
        if (suppliers.length === 0) throw new Error('Expected at least one supplier for viewer');
        const firstSupplier = suppliers[0];
        if (!firstSupplier) throw new Error('Expected supplier');
        const supplier = await viewerClient.suppliers.getSupplierByCode(
          ctx.shopContext,
          firstSupplier.code,
        );
        expect(supplier.id).toBe(firstSupplier.id);
      });

      it('viewer should NOT create supplier', async () => {
        await expectForbidden(() =>
          viewerClient.suppliers.createSupplier(ctx.shopContext, {
            code: 'viewer-supplier',
            title: 'Should Fail',
          }),
        );
      });

      it('viewer should NOT update supplier', async () => {
        const suppliers = await viewerClient.suppliers.getSuppliers(ctx.shopContext);
        if (suppliers.length > 0) {
          const firstSupplier = suppliers[0];
          if (!firstSupplier) throw new Error('Expected supplier');
          await expectForbidden(() =>
            viewerClient.suppliers.updateSupplier(ctx.shopContext, firstSupplier.id, {
              title: 'Should Fail',
            }),
          );
        }
      });

      it('viewer should NOT delete supplier', async () => {
        const suppliers = await viewerClient.suppliers.getSuppliers(ctx.shopContext);
        if (suppliers.length > 0) {
          const firstSupplier = suppliers[0];
          if (!firstSupplier) throw new Error('Expected supplier');
          await expectForbidden(() =>
            viewerClient.suppliers.deleteSupplier(ctx.shopContext, firstSupplier.id),
          );
        }
      });

      it('viewer should export suppliers', async () => {
        const exported = await viewerClient.suppliers.exportJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('viewer should NOT import suppliers', async () => {
        await expectForbidden(() =>
          viewerClient.suppliers.importJson(ctx.shopContext, [
            { code: 'test', title: 'Should Fail' },
          ]),
        );
      });
    });
  });
});
