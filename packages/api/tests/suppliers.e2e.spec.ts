import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError, SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { TestContext } from './test-context.js';

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
      tenantTitle: `Test Tenant ${Date.now()}`,
      userEmail: `supplier-test-${Date.now()}@example.com`,
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

      try {
        await noAuthClient.getSuppliers(ctx.shopContext);
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });
  });

  describe('CRUD Operations', () => {
    it('should create a supplier', async () => {
      const supplier = await ctx.client.createSupplier(
        { code: 'supplier1', title: 'Test Supplier 1' },
        ctx.shopContext,
      );

      expect(supplier).toBeDefined();
      expect(supplier.code).toBe('supplier1');
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
      expect(supplier.code).toBe('supplier1');
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
      expect(updated.code).toBe('supplier1');
    });

    it('should delete a supplier', async () => {
      await ctx.client.deleteSupplier(supplierId, ctx.shopContext);

      try {
        await ctx.client.getSupplier(supplierId, ctx.shopContext);
        expect.fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }
    });
  });

  describe('Import/Export', () => {
    it('should import suppliers from JSON', async () => {
      const result = await ctx.client.importSuppliersJson(
        {
          suppliers: [
            { code: 'import1', title: 'Import Supplier 1' },
            { code: 'import2', title: 'Import Supplier 2' },
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
      const csv = await ctx.client.exportSuppliersCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('code,title');
      expect(csv).toContain('import1');
    });

    it('should import suppliers from CSV', async () => {
      const csv = 'code,title\ncsv1,CSV Supplier 1\ncsv2,CSV Supplier 2';

      const result = await ctx.client.importSuppliersCsv(csv, ctx.shopContext);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should update existing suppliers on import', async () => {
      const result = await ctx.client.importSuppliersJson(
        {
          suppliers: [{ code: 'import1', title: 'Updated Import 1' }],
        },
        ctx.shopContext,
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);

      const suppliers = await ctx.client.getSuppliers(ctx.shopContext);
      const updated = suppliers.find((s) => s.code === 'import1');
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
