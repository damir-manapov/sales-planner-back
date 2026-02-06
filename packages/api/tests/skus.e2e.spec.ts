import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ROLE_NAMES } from '../src/common/constants.js';
import { normalizeCode, normalizeSkuCode } from '../src/lib/normalize-code.js';
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
      await expectUnauthorized(() => noAuthClient.skus.getAll(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.skus.getAll(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create SKU', async () => {
      const newSku = { code: generateTestCode('SKU'), title: 'Test SKU' };
      const sku = await ctx.client.skus.create(ctx.shopContext, newSku);

      expect(sku).toHaveProperty('id');
      expect(sku.code).toBe(newSku.code);
      expect(sku.title).toBe(newSku.title);
      expect(sku.shop_id).toBe(ctx.shop.id);
      expect(sku.tenant_id).toBe(ctx.tenant.id);
    });

    it('should list SKUs', async () => {
      await ctx.client.skus.create(ctx.shopContext, {
        code: generateTestCode('SKU-LIST'),
        title: 'List SKU',
      });

      const response = await ctx.client.skus.getAll(ctx.shopContext);

      expect(response).toHaveProperty('items');
      expect(response).toHaveProperty('total');
      expect(Array.isArray(response.items)).toBe(true);
      expect(response.items.length).toBeGreaterThan(0);
    });

    it('should paginate SKUs', async () => {
      // Create 5 SKUs
      for (let i = 0; i < 5; i++) {
        await ctx.client.skus.create(ctx.shopContext, {
          code: generateTestCode(`SKU-PAGE-${i}`),
          title: `Pagination SKU ${i}`,
        });
      }

      // Get first page
      const page1 = await ctx.client.skus.getAll(ctx.shopContext, { limit: 2, offset: 0 });
      expect(page1.items.length).toBe(2);
      expect(page1.limit).toBe(2);
      expect(page1.offset).toBe(0);
      expect(page1.total).toBeGreaterThanOrEqual(5);

      // Get second page
      const page2 = await ctx.client.skus.getAll(ctx.shopContext, { limit: 2, offset: 2 });
      expect(page2.items.length).toBe(2);
      expect(page2.offset).toBe(2);

      // First pages should have different items
      expect(page1.items[0]?.id).not.toBe(page2.items[0]?.id);
    });

    it('should get SKU by id', async () => {
      const created = await ctx.client.skus.create(ctx.shopContext, {
        code: generateTestCode('SKU-GET'),
        title: 'Get SKU',
      });

      const sku = await ctx.client.skus.getById(ctx.shopContext, created.id);

      expect(sku.id).toBe(created.id);
    });

    it('should get SKU by code', async () => {
      const created = await ctx.client.skus.create(ctx.shopContext, {
        code: generateTestCode('SKU-GET-CODE'),
        title: 'Get SKU Code',
      });

      const sku = await ctx.client.skus.getByCode(ctx.shopContext, created.code);

      expect(sku.id).toBe(created.id);
      expect(sku.code).toBe(created.code);
    });

    it('should update SKU', async () => {
      const created = await ctx.client.skus.create(ctx.shopContext, {
        code: generateTestCode('SKU-UPDATE'),
        title: 'To Update',
      });

      const sku = await ctx.client.skus.update(ctx.shopContext, created.id, {
        title: 'Updated SKU Title',
      });

      expect(sku.title).toBe('Updated SKU Title');
    });

    it('should return 409 on duplicate code', async () => {
      const duplicateCode = generateTestCode('SKU');
      await ctx.client.skus.create(ctx.shopContext, { code: duplicateCode, title: 'First SKU' });

      await expectConflict(() =>
        ctx.client.skus.create(ctx.shopContext, { code: duplicateCode, title: 'Duplicate SKU' }),
      );
    });
  });

  describe('Delete operations', () => {
    it('should delete SKU', async () => {
      const toDelete = await ctx.client.skus.create(ctx.shopContext, {
        code: generateTestCode('SKU-DELETE'),
        title: 'Delete SKU',
      });

      await ctx.client.skus.delete(ctx.shopContext, toDelete.id);
      await expectNotFound(() => ctx.client.skus.getById(ctx.shopContext, toDelete.id));
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
        ctx.client.skus.getAll({
          shop_id: otherCtx.shop.id,
          tenant_id: otherCtx.tenant.id,
        }),
      );
    });

    it('should return 403 when creating for other tenant', async () => {
      await expectForbidden(() =>
        ctx.client.skus.create(
          { shop_id: ctx.shop.id, tenant_id: otherCtx.tenant.id },
          { code: 'FORBIDDEN-SKU', title: 'Should Fail' },
        ),
      );
    });

    it('should return 404 when getting resource from other tenant', async () => {
      const otherSku = await otherCtx.client.skus.create(otherCtx.shopContext, {
        code: generateTestCode('OTHER'),
        title: 'Other SKU',
      });

      await expectNotFound(() => ctx.client.skus.getById(ctx.shopContext, otherSku.id));
      await expectForbidden(() =>
        ctx.client.skus.getByCode(
          {
            shop_id: ctx.shop.id,
            tenant_id: otherCtx.tenant.id,
          },
          otherSku.code,
        ),
      );
    });

    it('should allow same code in different tenants', async () => {
      const sharedCode = generateTestCode('SHARED');

      const sku1 = await ctx.client.skus.create(ctx.shopContext, {
        code: sharedCode,
        title: 'SKU in Tenant 1',
      });
      const sku2 = await otherCtx.client.skus.create(otherCtx.shopContext, {
        code: sharedCode,
        title: 'SKU in Tenant 2',
      });

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

      const result = await ctx.client.skus.importJson(ctx.shopContext, items);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toEqual([]);
      const { items: skus } = await ctx.client.skus.getAll(ctx.shopContext);
      const codes = skus.map((s) => s.code);
      expect(codes).toContain(normalizeSkuCode(code1));
      expect(codes).toContain(normalizeSkuCode(code2));
    });

    it('should export related codes in JSON and CSV', async () => {
      const code = generateTestCode('EXPORT-REL');
      const category = generateTestCode('cat-export');
      const group = generateTestCode('grp-export');
      const status = generateTestCode('sts-export');
      const supplier = generateTestCode('sup-export');
      const csvContent = `code,title,category,group,status,supplier\n${code},Export Relations,${category},${group},${status},${supplier}`;
      await ctx.client.skus.importCsv(ctx.shopContext, csvContent);

      const json = await ctx.client.skus.exportJson(ctx.shopContext);
      const exported = json.find((s) => s.code === normalizeSkuCode(code));
      expect(exported).toBeDefined();
      expect(exported?.category).toBe(normalizeCode(category));
      expect(exported?.group).toBe(normalizeCode(group));
      expect(exported?.status).toBe(normalizeCode(status));
      expect(exported?.supplier).toBe(normalizeCode(supplier));

      const csv = await ctx.client.skus.exportCsv(ctx.shopContext);
      const lines = csv.trim().split('\n');
      expect(lines.length).toBeGreaterThan(1);
      const body = lines.slice(1).join('\n');
      expect(body).toContain(normalizeSkuCode(code));
      expect(body).toContain(normalizeCode(category));
      expect(body).toContain(normalizeCode(group));
      expect(body).toContain(normalizeCode(status));
      expect(body).toContain(normalizeCode(supplier));
    });

    it('should handle partial relations', async () => {
      const code = generateTestCode('PARTIAL-REL');
      const category = generateTestCode('partial-category');
      const csvContent = `code,title,category,group,status,supplier\n${code},Partial Relations,${category},,,`;

      const result = await ctx.client.skus.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.categories_created).toBe(1);
      expect(result.groups_created).toBe(0);
      expect(result.statuses_created).toBe(0);
      expect(result.suppliers_created).toBe(0);

      const sku = (await ctx.client.skus.getAll(ctx.shopContext)).items.find(
        (s) => s.code === normalizeSkuCode(code),
      );
      expect(sku).toBeDefined();
      expect(sku?.category_id).toBeDefined();
      expect(sku?.group_id ?? null).toBeNull();
      expect(sku?.status_id ?? null).toBeNull();
      expect(sku?.supplier_id ?? null).toBeNull();

      const json = await ctx.client.skus.exportJson(ctx.shopContext);
      const exported = json.find((s) => s.code === normalizeSkuCode(code));
      expect(exported).toBeDefined();
      expect(exported?.category).toBe(normalizeCode(category));
      expect(exported?.group ?? null).toBeNull();
      expect(exported?.status ?? null).toBeNull();
      expect(exported?.supplier ?? null).toBeNull();

      const csv = await ctx.client.skus.exportCsv(ctx.shopContext);
      const line = csv
        .trim()
        .split('\n')
        .find((l) => l.includes(normalizeSkuCode(code)));
      expect(line).toBeDefined();
      if (!line) throw new Error('CSV line not found');
      expect(line).toContain(normalizeCode(category));
      expect(line).toContain(',,');
    });

    it('should upsert existing SKUs on import', async () => {
      const code = generateTestCode('UPSERT-JSON');

      await ctx.client.skus.importJson(ctx.shopContext, [{ code, title: 'Original Title' }]);
      const result = await ctx.client.skus.importJson(ctx.shopContext, [
        { code, title: 'Updated Title' },
      ]);

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should import SKUs from CSV with commas', async () => {
      const code1 = generateTestCode('IMPORT-CSV-1');
      const code2 = generateTestCode('IMPORT-CSV-2');
      const csvContent = `code,title\n${code1},Import CSV SKU 1\n${code2},Import CSV SKU 2`;

      const result = await ctx.client.skus.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);

      const { items: skus } = await ctx.client.skus.getAll(ctx.shopContext);
      const codes = skus.map((s) => s.code);
      expect(codes).toContain(normalizeSkuCode(code1));
      expect(codes).toContain(normalizeSkuCode(code2));
    });

    it('should import SKU without any relations', async () => {
      const code = generateTestCode('IMPORT-NO-REL');
      const csvContent = `code,title\n${code},No Relations SKU`;

      const result = await ctx.client.skus.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.categories_created).toBe(0);
      expect(result.groups_created).toBe(0);
      expect(result.statuses_created).toBe(0);
      expect(result.suppliers_created).toBe(0);

      const { items: skus } = await ctx.client.skus.getAll(ctx.shopContext);
      const createdSku = skus.find((s) => s.code === normalizeSkuCode(code));
      expect(createdSku).toBeDefined();
      expect(createdSku?.category_id ?? null).toBeNull();
      expect(createdSku?.group_id ?? null).toBeNull();
      expect(createdSku?.status_id ?? null).toBeNull();
      expect(createdSku?.supplier_id ?? null).toBeNull();
    });

    it('should auto-create and link related entities on CSV import', async () => {
      const code = generateTestCode('IMPORT-WITH-RELATIONS');
      const category = generateTestCode('test-category');
      const group = generateTestCode('test-group');
      const status = generateTestCode('test-status');
      const supplier = generateTestCode('test-supplier');
      const csvContent = `code,title,category,group,status,supplier\n${code},SKU with Relations,${category},${group},${status},${supplier}`;

      const result = await ctx.client.skus.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.categories_created).toBe(1);
      expect(result.groups_created).toBe(1);
      expect(result.statuses_created).toBe(1);
      expect(result.suppliers_created).toBe(1);

      const { items: skus } = await ctx.client.skus.getAll(ctx.shopContext);
      const createdSku = skus.find((s) => s.code === normalizeSkuCode(code));
      expect(createdSku).toBeDefined();
      expect(createdSku?.category_id).toBeDefined();
      expect(createdSku?.group_id).toBeDefined();
      expect(createdSku?.status_id).toBeDefined();
      expect(createdSku?.supplier_id).toBeDefined();

      const categoryEntity = await ctx.client.categories.getByCode(
        ctx.shopContext,
        normalizeCode(category),
      );
      const groupEntity = await ctx.client.groups.getByCode(
        ctx.shopContext,
        normalizeCode(group),
      );
      const statusEntity = await ctx.client.statuses.getByCode(
        ctx.shopContext,
        normalizeCode(status),
      );
      const supplierEntity = await ctx.client.suppliers.getByCode(
        ctx.shopContext,
        normalizeCode(supplier),
      );
      expect(categoryEntity.code).toBe(normalizeCode(category));
      expect(groupEntity.code).toBe(normalizeCode(group));
      expect(statusEntity.code).toBe(normalizeCode(status));
      expect(supplierEntity.code).toBe(normalizeCode(supplier));
    });

    it('should reuse existing related entities on import', async () => {
      const category = generateTestCode('existing-category');
      const group = generateTestCode('existing-group');
      const status = generateTestCode('existing-status');
      const supplier = generateTestCode('existing-supplier');

      const seedCode = generateTestCode('SEED-REL');
      const seedCsv = `code,title,category,group,status,supplier\n${seedCode},Seed SKU,${category},${group},${status},${supplier}`;
      await ctx.client.skus.importCsv(ctx.shopContext, seedCsv);
      const seedSku = (await ctx.client.skus.getAll(ctx.shopContext)).items.find(
        (s) => s.code === normalizeSkuCode(seedCode),
      );
      if (!seedSku) throw new Error('Seed SKU not created');

      const code = generateTestCode('REUSE-REL');
      const csvContent = `code,title,category,group,status,supplier\n${code},Reuse Relations,${category},${group},${status},${supplier}`;

      const result = await ctx.client.skus.importCsv(ctx.shopContext, csvContent);

      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.categories_created).toBe(0);
      expect(result.groups_created).toBe(0);
      expect(result.statuses_created).toBe(0);
      expect(result.suppliers_created).toBe(0);

      const { items: skus } = await ctx.client.skus.getAll(ctx.shopContext);
      const createdSku = skus.find((s) => s.code === normalizeSkuCode(code));
      expect(createdSku).toBeDefined();
      expect(createdSku?.category_id).toBe(seedSku.category_id);
      expect(createdSku?.group_id).toBe(seedSku.group_id);
      expect(createdSku?.status_id).toBe(seedSku.status_id);
      expect(createdSku?.supplier_id).toBe(seedSku.supplier_id);
    });

    it('should update relationships via import', async () => {
      const code = generateTestCode('REL-UPDATE');
      const categoryA = generateTestCode('cat-a');
      const groupA = generateTestCode('grp-a');
      const statusA = generateTestCode('sts-a');
      const supplierA = generateTestCode('sup-a');
      const categoryB = generateTestCode('cat-b');
      const groupB = generateTestCode('grp-b');
      const statusB = generateTestCode('sts-b');
      const supplierB = generateTestCode('sup-b');

      const csvA = `code,title,category,group,status,supplier\n${code},With Relations A,${categoryA},${groupA},${statusA},${supplierA}`;
      await ctx.client.skus.importCsv(ctx.shopContext, csvA);

      const csvB = `code,title,category,group,status,supplier\n${code},With Relations B,${categoryB},${groupB},${statusB},${supplierB}`;
      const result = await ctx.client.skus.importCsv(ctx.shopContext, csvB);

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.categories_created).toBe(1);
      expect(result.groups_created).toBe(1);
      expect(result.statuses_created).toBe(1);
      expect(result.suppliers_created).toBe(1);

      const sku = (await ctx.client.skus.getAll(ctx.shopContext)).items.find(
        (s) => s.code === normalizeSkuCode(code),
      );
      if (!sku) throw new Error('SKU not found after update');

      const catB = await ctx.client.categories.getByCode(
        ctx.shopContext,
        normalizeCode(categoryB),
      );
      const grpB = await ctx.client.groups.getByCode(ctx.shopContext, normalizeCode(groupB));
      const stsB = await ctx.client.statuses.getByCode(
        ctx.shopContext,
        normalizeCode(statusB),
      );
      const supB = await ctx.client.suppliers.getByCode(
        ctx.shopContext,
        normalizeCode(supplierB),
      );

      expect(sku.category_id).toBe(catB.id);
      expect(sku.group_id).toBe(grpB.id);
      expect(sku.status_id).toBe(stsB.id);
      expect(sku.supplier_id).toBe(supB.id);
    });

    it('should export SKUs to JSON', async () => {
      const code1 = generateTestCode('EXPORT-SKU-1');
      const code2 = generateTestCode('EXPORT-SKU-2');

      await ctx.client.skus.importJson(ctx.shopContext, [
        { code: code1, title: 'Export Test SKU 1' },
        { code: code2, title: 'Export Test SKU 2' },
      ]);

      const exported = await ctx.client.skus.exportJson(ctx.shopContext);

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

      await ctx.client.skus.importJson(ctx.shopContext, [
        { code: code1, title: 'CSV Export Test 1' },
        { code: code2, title: 'CSV Export Test 2' },
      ]);

      const csv = await ctx.client.skus.exportCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('code,title,category,title2,group,supplier,status');
      expect(lines.some((line) => line.includes(normalizeSkuCode(code1)))).toBe(true);
      expect(lines.some((line) => line.includes(normalizeSkuCode(code2)))).toBe(true);
    });
  });

  describe('Example downloads', () => {
    it('should return JSON example', async () => {
      const example = await ctx.client.skus.getExampleJson();

      expect(Array.isArray(example)).toBe(true);
      expect(example.length).toBeGreaterThan(0);
      expect(example[0]).toHaveProperty('code');
      expect(example[0]).toHaveProperty('title');
    });

    it('should return CSV example', async () => {
      const csv = await ctx.client.skus.getExampleCsv();

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
        const ownerSetup = await ctx.getSystemClient().tenants.createWithShopAndUser({
          tenantTitle: `Owner Tenant ${generateUniqueId()}`,
          userEmail: `owner-${generateUniqueId()}@example.com`,
          userName: 'Tenant Owner User',
        });

        ownerUserId = ownerSetup.user.id;
        ownerTenantId = ownerSetup.tenant.id;
        ownerShopId = ownerSetup.shop.id;
        ownerClient = new SalesPlannerClient({ baseUrl, apiKey: ownerSetup.apiKey });

        await ownerClient.skus.create(ownerCtx(), {
          code: generateTestCode('OWNER-SEED'),
          title: 'Owner Seed SKU',
        });
      });

      afterAll(async () => {
        if (ownerUserId) await cleanupUser(app, ownerUserId);
      });

      it('tenant owner should have read access without explicit role', async () => {
        const { items: skus } = await ownerClient.skus.getAll(ownerCtx());
        expect(Array.isArray(skus)).toBe(true);
        if (skus.length === 0) throw new Error('Expected at least one SKU for owner');
        const first = skus[0];
        if (!first) throw new Error('Expected sku');
        const sku = await ownerClient.skus.getByCode(ownerCtx(), first.code);
        expect(sku.id).toBe(first.id);
      });

      it('tenant owner should have write access without explicit role', async () => {
        const ownerSkuCode = generateTestCode('OWNER-SKU');
        const sku = await ownerClient.skus.create(ownerCtx(), {
          code: ownerSkuCode,
          title: 'Owner Created SKU',
        });
        expect(sku).toHaveProperty('id');
        await ownerClient.skus.delete(ownerCtx(), sku.id);
      });

      it('tenant owner should be able to import', async () => {
        const ownerImportCode = generateTestCode('OWNER-IMPORT');
        const result = await ownerClient.skus.importJson(ownerCtx(), [
          { code: ownerImportCode, title: 'Owner Import 1' },
        ]);
        expect(result.created + result.updated).toBe(1);
      });

      it('tenant owner should NOT access other tenants', async () => {
        await expectForbidden(() => ownerClient.skus.getAll(ctx.shopContext));
        const { items: skus } = await ctx.client.skus.getAll(ctx.shopContext);
        if (skus.length === 0) throw new Error('Expected at least one SKU in target tenant');
        const target = skus[0];
        if (!target) throw new Error('Expected sku');

        await expectForbidden(() => ownerClient.skus.getByCode(ctx.shopContext, target.code));
      });
    });

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
        const editorRole = roles.find((r) => r.name === ROLE_NAMES.EDITOR);
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

      it('editor should list SKUs', async () => {
        const { items: skus } = await editorClient.skus.getAll(ctx.shopContext);
        expect(Array.isArray(skus)).toBe(true);
      });

      it('editor should create SKU', async () => {
        const sku = await editorClient.skus.create(ctx.shopContext, {
          code: generateTestCode('EDITOR-SKU'),
          title: 'Editor SKU',
        });
        expect(sku).toHaveProperty('id');
      });

      it('editor should update SKU', async () => {
        const { items: skus } = await editorClient.skus.getAll(ctx.shopContext);
        if (skus.length === 0) throw new Error('Expected at least one SKU for editor update');
        const firstSku = skus[0];
        if (!firstSku) throw new Error('Expected sku');
        const updated = await editorClient.skus.update(ctx.shopContext, firstSku.id, {
          title: 'Editor Updated',
        });
        expect(updated.title).toBe('Editor Updated');
      });

      it('editor should delete SKU', async () => {
        const sku = await editorClient.skus.create(ctx.shopContext, {
          code: generateTestCode('EDITOR-DELETE'),
          title: 'To Delete',
        });
        await editorClient.skus.delete(ctx.shopContext, sku.id);
        await expectNotFound(() => editorClient.skus.getById(ctx.shopContext, sku.id));
      });

      it('editor should import SKUs', async () => {
        const result = await editorClient.skus.importJson(ctx.shopContext, [
          { code: generateTestCode('EDITOR-IMPORT'), title: 'Editor Import' },
        ]);
        expect(result.created).toBe(1);
      });

      it('editor should export SKUs', async () => {
        const exported = await editorClient.skus.exportJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('editor should get SKU by code', async () => {
        const { items: skus } = await editorClient.skus.getAll(ctx.shopContext);
        if (skus.length === 0) throw new Error('Expected at least one SKU for editor get-by-code');
        const firstSku = skus[0];
        if (!firstSku) throw new Error('Expected sku');
        const sku = await editorClient.skus.getByCode(ctx.shopContext, firstSku.code);
        expect(sku.id).toBe(firstSku.id);
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
        const viewerRole = roles.find((r) => r.name === ROLE_NAMES.VIEWER);
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

      it('viewer should list SKUs', async () => {
        const { items: skus } = await viewerClient.skus.getAll(ctx.shopContext);
        expect(Array.isArray(skus)).toBe(true);
      });

      it('viewer should get SKU by id', async () => {
        const { items: skus } = await viewerClient.skus.getAll(ctx.shopContext);
        if (skus.length === 0) throw new Error('Expected at least one SKU for viewer get-by-id');
        const firstSku = skus[0];
        if (!firstSku) throw new Error('Expected sku');
        const sku = await viewerClient.skus.getById(ctx.shopContext, firstSku.id);
        expect(sku.id).toBe(firstSku.id);
      });

      it('viewer should get SKU by code', async () => {
        const { items: skus } = await viewerClient.skus.getAll(ctx.shopContext);
        if (skus.length === 0) throw new Error('Expected at least one SKU for viewer get-by-code');
        const firstSku = skus[0];
        if (!firstSku) throw new Error('Expected sku');
        const sku = await viewerClient.skus.getByCode(ctx.shopContext, firstSku.code);
        expect(sku.id).toBe(firstSku.id);
      });

      it('viewer should NOT create SKU', async () => {
        await expectForbidden(() =>
          viewerClient.skus.create(ctx.shopContext, {
            code: 'VIEWER-CREATE',
            title: 'Should Fail',
          }),
        );
      });

      it('viewer should NOT update SKU', async () => {
        const { items: skus } = await viewerClient.skus.getAll(ctx.shopContext);
        if (skus.length > 0) {
          const firstSku = skus[0];
          if (!firstSku) throw new Error('Expected sku');
          await expectForbidden(() =>
            viewerClient.skus.update(ctx.shopContext, firstSku.id, { title: 'Should Fail' }),
          );
        }
      });

      it('viewer should NOT delete SKU', async () => {
        const { items: skus } = await viewerClient.skus.getAll(ctx.shopContext);
        if (skus.length > 0) {
          const firstSku = skus[0];
          if (!firstSku) throw new Error('Expected sku');
          await expectForbidden(() => viewerClient.skus.delete(ctx.shopContext, firstSku.id));
        }
      });

      it('viewer should export SKUs', async () => {
        const exported = await viewerClient.skus.exportJson(ctx.shopContext);
        expect(Array.isArray(exported)).toBe(true);
      });

      it('viewer should NOT import SKUs', async () => {
        await expectForbidden(() =>
          viewerClient.skus.importJson(ctx.shopContext, [
            { code: 'VIEWER-IMPORT', title: 'Should Fail' },
          ]),
        );
      });
    });
  });
});
