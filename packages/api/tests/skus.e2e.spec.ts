import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ROLE_NAMES } from '../src/common/constants.js';
import { normalizeSkuCode } from '../src/lib/normalize-code.js';
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

describe('SKUs (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let skuId: number;

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
      userEmail: `sku-test-${generateUniqueId()}@example.com`,
      userName: 'SKU Test User',
    });
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.getSkus(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.getSkus(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create SKU', async () => {
      const newSku = { code: generateTestCode('SKU'), title: 'Test SKU' };
      const sku = await ctx.client.createSku(newSku, ctx.shopContext);

      expect(sku).toHaveProperty('id');
      expect(sku.code).toBe(newSku.code);
      expect(sku.title).toBe(newSku.title);
      expect(sku.shop_id).toBe(ctx.shop.id);
      expect(sku.tenant_id).toBe(ctx.tenant.id);

      skuId = sku.id;
    });

    it('should list SKUs', async () => {
      const skus = await ctx.client.getSkus(ctx.shopContext);

      expect(Array.isArray(skus)).toBe(true);
      expect(skus.length).toBeGreaterThan(0);
    });

    it('should get SKU by id', async () => {
      const sku = await ctx.client.getSku(skuId, ctx.shopContext);

      expect(sku.id).toBe(skuId);
    });

    it('should update SKU', async () => {
      const sku = await ctx.client.updateSku(
        skuId,
        { title: 'Updated SKU Title' },
        ctx.shopContext,
      );

      expect(sku.title).toBe('Updated SKU Title');
    });

    it('should return 409 on duplicate code', async () => {
      const duplicateCode = generateTestCode('SKU');
      await ctx.client.createSku({ code: duplicateCode, title: 'First SKU' }, ctx.shopContext);

      await expectConflict(() =>
        ctx.client.createSku({ code: duplicateCode, title: 'Duplicate SKU' }, ctx.shopContext),
      );
    });
  });

  describe('Delete operations', () => {
    it('should delete SKU', async () => {
      await ctx.client.deleteSku(skuId, ctx.shopContext);
      await expectNotFound(() => ctx.client.getSku(skuId, ctx.shopContext));
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
        ctx.client.getSkus({
          shop_id: otherCtx.shop.id,
          tenant_id: otherCtx.tenant.id,
        }),
      );
    });

    it('should return 403 when creating for other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.createSku(
          { code: 'FORBIDDEN-SKU', title: 'Should Fail' },
          { shop_id: ctx.shop.id, tenant_id: otherCtx.tenant.id },
        ),
      );
    });

    it('should return 404 when getting resource from other tenant', async () => {
      const otherSku = await otherCtx.client.createSku(
        { code: generateTestCode('OTHER'), title: 'Other SKU' },
        otherCtx.shopContext,
      );

      await expectNotFound(() => ctx.client.getSku(otherSku.id, ctx.shopContext));
    });

    it('should allow same code in different tenants', async () => {
      const sharedCode = generateTestCode('SHARED');

      const sku1 = await ctx.client.createSku(
        { code: sharedCode, title: 'SKU in Tenant 1' },
        ctx.shopContext,
      );
      const sku2 = await otherCtx.client.createSku(
        { code: sharedCode, title: 'SKU in Tenant 2' },
        otherCtx.shopContext,
      );

      expect(sku1.code).toBe(sharedCode);
      expect(sku2.code).toBe(sharedCode);
      expect(sku1.tenant_id).not.toBe(sku2.tenant_id);
    });
  });

  describe('Import/Export', () => {
    it('should import SKUs from JSON', async () => {
      const code1 = generateTestCode('IMPORT-JSON-1');
      const code2 = generateTestCode('IMPORT-JSON-2');
      const items = [
        { code: code1, title: 'Import JSON SKU 1' },
        { code: code2, title: 'Import JSON SKU 2' },
      ];

      const result = await ctx.client.importSkusJson(items, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);

      const skus = await ctx.client.getSkus(ctx.shopContext);
      const codes = skus.map((s) => s.code);
      expect(codes).toContain(normalizeSkuCode(code1));
      expect(codes).toContain(normalizeSkuCode(code2));
    });

    it('should upsert existing SKUs on import', async () => {
      const code = generateTestCode('UPSERT-JSON');

      await ctx.client.importSkusJson([{ code, title: 'Original Title' }], ctx.shopContext);
      const result = await ctx.client.importSkusJson(
        [{ code, title: 'Updated Title' }],
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should import SKUs from CSV with commas', async () => {
      const code1 = generateTestCode('IMPORT-CSV-1');
      const code2 = generateTestCode('IMPORT-CSV-2');
      const csvContent = `code,title\n${code1},Import CSV SKU 1\n${code2},Import CSV SKU 2`;

      const result = await ctx.client.importSkusCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const skus = await ctx.client.getSkus(ctx.shopContext);
      const codes = skus.map((s) => s.code);
      expect(codes).toContain(normalizeSkuCode(code1));
      expect(codes).toContain(normalizeSkuCode(code2));
    });

    it('should auto-create related entities on CSV import', async () => {
      const code = generateTestCode('IMPORT-WITH-RELATIONS');
      const category = generateTestCode('test-category');
      const group = generateTestCode('test-group');
      const status = generateTestCode('test-status');
      const supplier = generateTestCode('test-supplier');
      const csvContent = `code,title,category,group,status,supplier\n${code},SKU with Relations,${category},${group},${status},${supplier}`;

      const result = await ctx.client.importSkusCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result).toHaveProperty('categories_created');
      expect(result).toHaveProperty('groups_created');
      expect(result).toHaveProperty('statuses_created');
      expect(result).toHaveProperty('suppliers_created');

      const skus = await ctx.client.getSkus(ctx.shopContext);
      const createdSku = skus.find((s) => s.code === normalizeSkuCode(code));
      expect(createdSku).toBeDefined();
    });

    it('should export SKUs to JSON', async () => {
      const code1 = generateTestCode('EXPORT-SKU-1');
      const code2 = generateTestCode('EXPORT-SKU-2');

      await ctx.client.importSkusJson(
        [
          { code: code1, title: 'Export Test SKU 1' },
          { code: code2, title: 'Export Test SKU 2' },
        ],
        ctx.shopContext,
      );

      const exported = await ctx.client.exportSkusJson(ctx.shopContext);

      expect(Array.isArray(exported)).toBe(true);
      const exportedCodes = exported.map((s) => s.code);
      expect(exportedCodes).toContain(normalizeSkuCode(code1));
      expect(exportedCodes).toContain(normalizeSkuCode(code2));

      const item = exported.find((s) => s.code === normalizeSkuCode(code1));
      expect(item).toMatchObject({ code: normalizeSkuCode(code1), title: 'Export Test SKU 1' });
      expect(item).toHaveProperty('code');
      expect(item).toHaveProperty('title');
    });

    it('should export SKUs to CSV', async () => {
      const code1 = generateTestCode('CSV-EXPORT-SKU-1');
      const code2 = generateTestCode('CSV-EXPORT-SKU-2');

      await ctx.client.importSkusJson(
        [
          { code: code1, title: 'CSV Export Test 1' },
          { code: code2, title: 'CSV Export Test 2' },
        ],
        ctx.shopContext,
      );

      const csv = await ctx.client.exportSkusCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('code,title,category,group,status,supplier');
      expect(lines.some((line) => line.includes(normalizeSkuCode(code1)))).toBe(true);
      expect(lines.some((line) => line.includes(normalizeSkuCode(code2)))).toBe(true);
    });
  });

  describe('Example downloads', () => {
    it('should return JSON example', async () => {
      const example = await ctx.client.getSkusExampleJson();

      expect(Array.isArray(example)).toBe(true);
      expect(example.length).toBeGreaterThan(0);
      expect(example[0]).toHaveProperty('code');
      expect(example[0]).toHaveProperty('title');
    });

    it('should return CSV example', async () => {
      const csv = await ctx.client.getSkusExampleCsv();

      expect(typeof csv).toBe('string');
      expect(csv).toContain('code,title');
      expect(csv).toContain('SKU-001');
    });
  });

  describe('Role-based access', () => {
    describe('Tenant owner role', () => {
      let ownerUserId: number;
      let ownerClient: SalesPlannerClient;
      let ownerTenantId: number;
      let ownerShopId: number;

      const ownerCtx = () => ({ shop_id: ownerShopId, tenant_id: ownerTenantId });

      beforeAll(async () => {
        const ownerSetup = await ctx.getSystemClient().createTenantWithShopAndUser({
          tenantTitle: `Owner Tenant ${generateUniqueId()}`,
          userEmail: `owner-${generateUniqueId()}@example.com`,
          userName: 'Tenant Owner User',
        });

        ownerUserId = ownerSetup.user.id;
        ownerTenantId = ownerSetup.tenant.id;
        ownerShopId = ownerSetup.shop.id;
        ownerClient = new SalesPlannerClient({ baseUrl, apiKey: ownerSetup.apiKey });
      });

      afterAll(async () => {
        if (ownerUserId) await cleanupUser(app, ownerUserId);
      });

      it('tenant owner should have read access without explicit role', async () => {
        const skus = await ownerClient.getSkus(ownerCtx());
        expect(Array.isArray(skus)).toBe(true);
      });

      it('tenant owner should have write access without explicit role', async () => {
        const ownerSkuCode = generateTestCode('OWNER-SKU');
        const sku = await ownerClient.createSku(
          { code: ownerSkuCode, title: 'Owner Created SKU' },
          ownerCtx(),
        );
        expect(sku).toHaveProperty('id');
        await ownerClient.deleteSku(sku.id, ownerCtx());
      });

      it('tenant owner should be able to import', async () => {
        const ownerImportCode = generateTestCode('OWNER-IMPORT');
        const result = await ownerClient.importSkusJson(
          [{ code: ownerImportCode, title: 'Owner Import 1' }],
          ownerCtx(),
        );
        expect(result.created + result.updated).toBe(1);
      });

      it('tenant owner should NOT access other tenants', async () => {
        await expectForbidden(() => ownerClient.getSkus(ctx.shopContext));
      });
    });

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

      it('editor should list SKUs', async () => {
        const skus = await editorClient.getSkus(ctx.shopContext);
        expect(Array.isArray(skus)).toBe(true);
      });

      it('editor should create SKU', async () => {
        const sku = await editorClient.createSku(
          { code: generateTestCode('EDITOR-SKU'), title: 'Editor SKU' },
          ctx.shopContext,
        );
        expect(sku).toHaveProperty('id');
      });

      it('editor should update SKU', async () => {
        const skus = await editorClient.getSkus(ctx.shopContext);
        if (skus.length > 0) {
          const firstSku = skus[0];
          if (!firstSku) throw new Error('Expected sku');
          const updated = await editorClient.updateSku(
            firstSku.id,
            { title: 'Editor Updated' },
            ctx.shopContext,
          );
          expect(updated.title).toBe('Editor Updated');
        }
      });

      it('editor should delete SKU', async () => {
        const sku = await editorClient.createSku(
          { code: generateTestCode('EDITOR-DELETE'), title: 'To Delete' },
          ctx.shopContext,
        );
        await editorClient.deleteSku(sku.id, ctx.shopContext);
        await expectNotFound(() => editorClient.getSku(sku.id, ctx.shopContext));
      });

      it('editor should import SKUs', async () => {
        const result = await editorClient.importSkusJson(
          [{ code: generateTestCode('EDITOR-IMPORT'), title: 'Editor Import' }],
          ctx.shopContext,
        );
        expect(result.created).toBe(1);
      });

      it('editor should export SKUs', async () => {
        const exported = await editorClient.exportSkusJson(ctx.shopContext);
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

      it('viewer should list SKUs', async () => {
        const skus = await viewerClient.getSkus(ctx.shopContext);
        expect(Array.isArray(skus)).toBe(true);
      });

      it('viewer should get SKU by id', async () => {
        const skus = await viewerClient.getSkus(ctx.shopContext);
        if (skus.length > 0) {
          const firstSku = skus[0];
          if (!firstSku) throw new Error('Expected sku');
          const sku = await viewerClient.getSku(firstSku.id, ctx.shopContext);
          expect(sku.id).toBe(firstSku.id);
        }
      });

      it('viewer should NOT create SKU', async () => {
        await expectForbidden(() =>
          viewerClient.createSku({ code: 'VIEWER-CREATE', title: 'Should Fail' }, ctx.shopContext),
        );
      });

      it('viewer should NOT update SKU', async () => {
        const skus = await viewerClient.getSkus(ctx.shopContext);
        if (skus.length > 0) {
          const firstSku = skus[0];
          if (!firstSku) throw new Error('Expected sku');
          await expectForbidden(() =>
            viewerClient.updateSku(firstSku.id, { title: 'Should Fail' }, ctx.shopContext),
          );
        }
      });

      it('viewer should NOT delete SKU', async () => {
        const skus = await viewerClient.getSkus(ctx.shopContext);
        if (skus.length > 0) {
          const firstSku = skus[0];
          if (!firstSku) throw new Error('Expected sku');
          await expectForbidden(() => viewerClient.deleteSku(firstSku.id, ctx.shopContext));
        }
      });

      it('viewer should export SKUs', async () => {
        const exported = await viewerClient.exportSkusJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('viewer should NOT import SKUs', async () => {
        await expectForbidden(() =>
          viewerClient.importSkusJson(
            [{ code: 'VIEWER-IMPORT', title: 'Should Fail' }],
            ctx.shopContext,
          ),
        );
      });
    });
  });
});
