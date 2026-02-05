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
  let supplierId: number;

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
      await expectUnauthorized(() => noAuthClient.getSuppliers(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.getSuppliers(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create supplier', async () => {
      const newSupplier = { code: generateTestCode('supplier'), title: 'Test Supplier' };
      const supplier = await ctx.client.createSupplier(newSupplier, ctx.shopContext);

      expect(supplier).toHaveProperty('id');
      expect(supplier.code).toBe(normalizeCode(newSupplier.code));
      expect(supplier.title).toBe(newSupplier.title);
      expect(supplier.shop_id).toBe(ctx.shop.id);
      expect(supplier.tenant_id).toBe(ctx.tenant.id);

      supplierId = supplier.id;
    });

    it('should list suppliers', async () => {
      const suppliers = await ctx.client.getSuppliers(ctx.shopContext);

      expect(Array.isArray(suppliers)).toBe(true);
      expect(suppliers.length).toBeGreaterThan(0);
    });

    it('should get supplier by id', async () => {
      const supplier = await ctx.client.getSupplier(supplierId, ctx.shopContext);

      expect(supplier.id).toBe(supplierId);
    });

    it('should update supplier', async () => {
      const supplier = await ctx.client.updateSupplier(
        supplierId,
        { title: 'Updated Supplier Title' },
        ctx.shopContext,
      );

      expect(supplier.title).toBe('Updated Supplier Title');
    });

    it('should return 409 on duplicate code', async () => {
      const duplicateCode = generateTestCode('supplier');
      await ctx.client.createSupplier({ code: duplicateCode, title: 'First Supplier' }, ctx.shopContext);

      await expectConflict(() =>
        ctx.client.createSupplier({ code: duplicateCode, title: 'Duplicate Supplier' }, ctx.shopContext),
      );
    });

    it('should return 404 for non-existent supplier', async () => {
      await expectNotFound(() => ctx.client.getSupplier(999999, ctx.shopContext));
    });
  });

  describe('Delete operations', () => {
    it('should delete supplier', async () => {
      await ctx.client.deleteSupplier(supplierId, ctx.shopContext);
      await expectNotFound(() => ctx.client.getSupplier(supplierId, ctx.shopContext));
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
        ctx.client.getSuppliers({
          shop_id: otherCtx.shop.id,
          tenant_id: otherCtx.tenant.id,
        }),
      );
    });

    it('should return 403 when creating for other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.createSupplier(
          { code: 'forbidden-supplier', title: 'Should Fail' },
          { shop_id: ctx.shop.id, tenant_id: otherCtx.tenant.id },
        ),
      );
    });

    it('should return 404 when getting resource from other tenant', async () => {
      const otherSupplier = await otherCtx.client.createSupplier(
        { code: generateTestCode('other'), title: 'Other Supplier' },
        otherCtx.shopContext,
      );

      await expectNotFound(() => ctx.client.getSupplier(otherSupplier.id, ctx.shopContext));
    });

    it('should allow same code in different tenants', async () => {
      const sharedCode = generateTestCode('shared');

      const supplier1 = await ctx.client.createSupplier(
        { code: sharedCode, title: 'Supplier in Tenant 1' },
        ctx.shopContext,
      );
      const supplier2 = await otherCtx.client.createSupplier(
        { code: sharedCode, title: 'Supplier in Tenant 2' },
        otherCtx.shopContext,
      );

      expect(supplier1.code).toBe(normalizeCode(sharedCode));
      expect(supplier2.code).toBe(normalizeCode(sharedCode));
      expect(supplier1.tenant_id).not.toBe(supplier2.tenant_id);
    });
  });

  describe('Import/Export', () => {
    it('should import suppliers from JSON', async () => {
      const code1 = generateTestCode('import-json-1');
      const code2 = generateTestCode('import-json-2');

      const result = await ctx.client.importSuppliersJson(
        { suppliers: [
          { code: code1, title: 'Import JSON Supplier 1' },
          { code: code2, title: 'Import JSON Supplier 2' },
        ] },
        ctx.shopContext,
      );

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);

      const suppliers = await ctx.client.getSuppliers(ctx.shopContext);
      const codes = suppliers.map((s) => s.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should upsert existing suppliers on import', async () => {
      const code = generateTestCode('upsert-json');

      await ctx.client.importSuppliersJson(
        { suppliers: [{ code, title: 'Original Title' }] },
        ctx.shopContext,
      );
      const result = await ctx.client.importSuppliersJson(
        { suppliers: [{ code, title: 'Updated Title' }] },
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should import suppliers from CSV', async () => {
      const code1 = generateTestCode('import-csv-1');
      const code2 = generateTestCode('import-csv-2');
      const csvContent = `code,title\n${code1},Import CSV Supplier 1\n${code2},Import CSV Supplier 2`;

      const result = await ctx.client.importSuppliersCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const suppliers = await ctx.client.getSuppliers(ctx.shopContext);
      const codes = suppliers.map((s) => s.code);
      expect(codes).toContain(normalizeCode(code1));
      expect(codes).toContain(normalizeCode(code2));
    });

    it('should export suppliers to JSON', async () => {
      const code1 = generateTestCode('export-supplier-1');
      const code2 = generateTestCode('export-supplier-2');

      await ctx.client.importSuppliersJson(
        { suppliers: [
          { code: code1, title: 'Export Test Supplier 1' },
          { code: code2, title: 'Export Test Supplier 2' },
        ] },
        ctx.shopContext,
      );

      const exported = await ctx.client.exportSuppliersJson(ctx.shopContext);

      expect(Array.isArray(exported)).toBe(true);
      const exportedCodes = exported.map((s) => s.code);
      expect(exportedCodes).toContain(normalizeCode(code1));
      expect(exportedCodes).toContain(normalizeCode(code2));
    });

    it('should export suppliers to CSV', async () => {
      const code1 = generateTestCode('csv-export-supplier-1');
      const code2 = generateTestCode('csv-export-supplier-2');

      await ctx.client.importSuppliersJson(
        { suppliers: [
          { code: code1, title: 'CSV Export Test 1' },
          { code: code2, title: 'CSV Export Test 2' },
        ] },
        ctx.shopContext,
      );

      const csv = await ctx.client.exportSuppliersCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('code,title');
      expect(csv).toContain(normalizeCode(code1));
      expect(csv).toContain(normalizeCode(code2));
    });
  });

  describe('Example downloads', () => {
    it('should return JSON example', async () => {
      const examples = await ctx.client.getSupplierExamplesJson();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('code');
      expect(examples[0]).toHaveProperty('title');
    });

    it('should return CSV example', async () => {
      const csv = await ctx.client.getSupplierExamplesCsv();

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
        if (editorRole) {
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

      it('editor should list suppliers', async () => {
        const suppliers = await editorClient.getSuppliers(ctx.shopContext);
        expect(Array.isArray(suppliers)).toBe(true);
      });

      it('editor should create supplier', async () => {
        const supplier = await editorClient.createSupplier(
          { code: generateTestCode('editor-supplier'), title: 'Editor Supplier' },
          ctx.shopContext,
        );
        expect(supplier).toHaveProperty('id');
      });

      it('editor should update supplier', async () => {
        const suppliers = await editorClient.getSuppliers(ctx.shopContext);
        if (suppliers.length > 0) {
          const firstSupplier = suppliers[0]!;
          const updated = await editorClient.updateSupplier(
            firstSupplier.id,
            { title: 'Editor Updated' },
            ctx.shopContext,
          );
          expect(updated.title).toBe('Editor Updated');
        }
      });

      it('editor should delete supplier', async () => {
        const supplier = await editorClient.createSupplier(
          { code: generateTestCode('editor-delete'), title: 'To Delete' },
          ctx.shopContext,
        );
        await editorClient.deleteSupplier(supplier.id, ctx.shopContext);
        await expectNotFound(() => editorClient.getSupplier(supplier.id, ctx.shopContext));
      });

      it('editor should import suppliers', async () => {
        const result = await editorClient.importSuppliersJson(
          { suppliers: [{ code: generateTestCode('editor-import'), title: 'Editor Import' }] },
          ctx.shopContext,
        );
        expect(result.created).toBe(1);
      });

      it('editor should export suppliers', async () => {
        const exported = await editorClient.exportSuppliersJson(ctx.shopContext);
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
        if (viewerUserId) await cleanupUser(app, viewerUserId);
      });

      it('viewer should list suppliers', async () => {
        const suppliers = await viewerClient.getSuppliers(ctx.shopContext);
        expect(Array.isArray(suppliers)).toBe(true);
      });

      it('viewer should get supplier by id', async () => {
        const suppliers = await viewerClient.getSuppliers(ctx.shopContext);
        if (suppliers.length > 0) {
          const firstSupplier = suppliers[0]!;
          const supplier = await viewerClient.getSupplier(firstSupplier.id, ctx.shopContext);
          expect(supplier.id).toBe(firstSupplier.id);
        }
      });

      it('viewer should NOT create supplier', async () => {
        await expectForbidden(() =>
          viewerClient.createSupplier(
            { code: 'viewer-supplier', title: 'Should Fail' },
            ctx.shopContext,
          ),
        );
      });

      it('viewer should NOT update supplier', async () => {
        const suppliers = await viewerClient.getSuppliers(ctx.shopContext);
        if (suppliers.length > 0) {
          const firstSupplier = suppliers[0]!;
          await expectForbidden(() =>
            viewerClient.updateSupplier(firstSupplier.id, { title: 'Should Fail' }, ctx.shopContext),
          );
        }
      });

      it('viewer should NOT delete supplier', async () => {
        const suppliers = await viewerClient.getSuppliers(ctx.shopContext);
        if (suppliers.length > 0) {
          const firstSupplier = suppliers[0]!;
          await expectForbidden(() => viewerClient.deleteSupplier(firstSupplier.id, ctx.shopContext));
        }
      });

      it('viewer should export suppliers', async () => {
        const exported = await viewerClient.exportSuppliersJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('viewer should NOT import suppliers', async () => {
        await expectForbidden(() =>
          viewerClient.importSuppliersJson(
            { suppliers: [{ code: 'test', title: 'Should Fail' }] },
            ctx.shopContext,
          ),
        );
      });
    });
  });
});
