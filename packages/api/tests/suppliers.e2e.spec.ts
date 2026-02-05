import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { normalizeCode } from '../src/lib/normalize-code.js';
import { TestContext } from './test-context.js';
import { generateUniqueId, generateTestCode, expectUnauthorized, expectNotFound } from './test-helpers.js';

describe('Suppliers (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let supplierId: number;
  let supplierCode: string;
  let normalizedSupplierCode: string;

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
    // Generate unique supplier code for this test run
    supplierCode = generateTestCode('supplier');
    normalizedSupplierCode = normalizeCode(supplierCode);
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
  });

  describe('CRUD Operations', () => {
    it('should create a supplier', async () => {
      const supplier = await ctx.client.createSupplier(
        { code: supplierCode, title: 'Test Supplier 1' },
        ctx.shopContext,
      );

      expect(supplier).toBeDefined();
      expect(supplier.code).toBe(normalizedSupplierCode);
      expect(supplier.title).toBe('Test Supplier 1');
      expect(supplier.shop_id).toBe(ctx.shopContext.shop_id);
      expect(supplier.tenant_id).toBe(ctx.shopContext.tenant_id);

      supplierId = supplier.id;
    });

    it('should get all suppliers', async () => {
      const suppliers = await ctx.client.getSuppliers(ctx.shopContext);

      expect(Array.isArray(suppliers)).toBe(true);
      expect(suppliers.length).toBeGreaterThan(0);
      expect(suppliers[0]).toHaveProperty('code');
      expect(suppliers[0]).toHaveProperty('title');
    });

    it('should get supplier by id', async () => {
      const supplier = await ctx.client.getSupplier(supplierId, ctx.shopContext);

      expect(supplier).toBeDefined();
      expect(supplier.id).toBe(supplierId);
      expect(supplier.code).toBe(normalizedSupplierCode);
    });

    it('should update a supplier', async () => {
      const updated = await ctx.client.updateSupplier(
        supplierId,
        { title: 'Updated Supplier' },
        ctx.shopContext,
      );

      expect(updated).toBeDefined();
      expect(updated.id).toBe(supplierId);
      expect(updated.title).toBe('Updated Supplier');
      expect(updated.code).toBe(normalizedSupplierCode);
    });

    it('should return 404 for non-existent supplier', async () => {
      await expectNotFound(() => ctx.client.getSupplier(999999, ctx.shopContext));
    });

    it('should delete a supplier', async () => {
      await ctx.client.deleteSupplier(supplierId, ctx.shopContext);

      await expectNotFound(() => ctx.client.getSupplier(supplierId, ctx.shopContext));
    });
  });

  describe('Import/Export', () => {
    it('should import suppliers from JSON', async () => {
      const import1Code = generateTestCode('import1');
      const import2Code = generateTestCode('import2');

      const result = await ctx.client.importSuppliersJson(
        {
          suppliers: [
            { code: import1Code, title: 'Import Supplier 1' },
            { code: import2Code, title: 'Import Supplier 2' },
          ],
        },
        ctx.shopContext,
      );

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should export suppliers as JSON', async () => {
      const suppliers = await ctx.client.exportSuppliersJson(ctx.shopContext);

      expect(Array.isArray(suppliers)).toBe(true);
      expect(suppliers.length).toBeGreaterThanOrEqual(2);
      expect(suppliers[0]).toHaveProperty('code');
      expect(suppliers[0]).toHaveProperty('title');
    });

    it('should export suppliers as CSV', async () => {
      // Create specific test data for this CSV export test
      const csvTestCode = generateTestCode('csv-export');
      const normalizedCsvCode = normalizeCode(csvTestCode);

      await ctx.client.importSuppliersJson(
        {
          suppliers: [{ code: csvTestCode, title: 'CSV Export Test' }],
        },
        ctx.shopContext,
      );

      const exportedCsv = await ctx.client.exportSuppliersCsv(ctx.shopContext);

      expect(typeof exportedCsv).toBe('string');
      expect(exportedCsv).toContain('code,title');
      expect(exportedCsv).toContain(normalizedCsvCode);
    });

    it('should import suppliers from CSV', async () => {
      const csv1Code = generateTestCode('csv1');
      const csv2Code = generateTestCode('csv2');
      const csvContent = `code,title\n${csv1Code},CSV Supplier 1\n${csv2Code},CSV Supplier 2`;

      const result = await ctx.client.importSuppliersCsv(csvContent, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should update existing suppliers on import', async () => {
      const updateTestCode = generateTestCode('update-test');

      // First create the supplier
      await ctx.client.importSuppliersJson(
        {
          suppliers: [{ code: updateTestCode, title: 'Original Title' }],
        },
        ctx.shopContext,
      );

      // Then update it
      const result = await ctx.client.importSuppliersJson(
        {
          suppliers: [{ code: updateTestCode, title: 'Updated Import 1' }],
        },
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);

      const suppliers = await ctx.client.getSuppliers(ctx.shopContext);
      const normalizedUpdateCode = normalizeCode(updateTestCode);
      const updated = suppliers.find((s) => s.code === normalizedUpdateCode);
      expect(updated?.title).toBe('Updated Import 1');
    });
  });

  describe('Examples', () => {
    it('should get example suppliers JSON', async () => {
      const examples = await ctx.client.getSupplierExamplesJson();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('code');
      expect(examples[0]).toHaveProperty('title');
    });

    it('should get example suppliers CSV', async () => {
      const csv = await ctx.client.getSupplierExamplesCsv();

      expect(typeof csv).toBe('string');
      expect(csv).toContain('code,title');
    });
  });
});
