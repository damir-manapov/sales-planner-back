import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { TestContext } from './test-context.js';
import {
  expectConflict,
  expectUnauthorized,
  generateTestCode,
  generateTestPeriod,
  generateTestPeriodRange,
  generateUniqueId,
} from './test-helpers.js';

describe('Leftovers (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let skuId: number;
  let warehouseId: number;
  let leftoverId: number;

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
      userEmail: `leftovers-test-${generateUniqueId()}@example.com`,
      userName: 'Leftovers Test User',
    });

    // Create test SKU
    const sku = await ctx.client.skus.create(ctx.shopContext, {
      code: generateTestCode('SKU-LEFTOVER'),
      title: 'Test SKU for Leftovers',
    });
    skuId = sku.id;

    // Create test warehouse
    const warehouse = await ctx.client.warehouses.create(ctx.shopContext, {
      code: generateTestCode('WH'),
      title: 'Test Warehouse',
    });
    warehouseId = warehouse.id;
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.leftovers.getAll(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.leftovers.getAll(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create leftover record', async () => {
      const testPeriod = generateTestPeriod();
      const record = await ctx.client.leftovers.create(ctx.shopContext, {
        sku_id: skuId,
        warehouse_id: warehouseId,
        period: testPeriod,
        quantity: 100,
      });

      expect(record).toHaveProperty('id');
      expect(record.sku_id).toBe(skuId);
      expect(record.warehouse_id).toBe(warehouseId);
      expect(record.period).toBe(testPeriod);
      expect(record.quantity).toBe(100);
      expect(record.shop_id).toBe(ctx.shop.id);
      expect(record.tenant_id).toBe(ctx.tenant.id);

      leftoverId = record.id;
    });

    it('should list leftovers', async () => {
      const records = await ctx.client.leftovers.getAll(ctx.shopContext);

      expect(Array.isArray(records.items)).toBe(true);
      expect(records.items.length).toBeGreaterThan(0);
    });

    it('should filter leftovers by ids', async () => {
      const testWarehouse = await ctx.client.warehouses.create(ctx.shopContext, {
        code: generateTestCode('WH-IDS'),
        title: 'IDs Filter WH',
      });
      const testSku = await ctx.client.skus.create(ctx.shopContext, {
        code: generateTestCode('SKU-LO-IDS'),
        title: 'IDs Filter SKU',
      });

      const record1 = await ctx.client.leftovers.create(ctx.shopContext, {
        sku_id: testSku.id,
        warehouse_id: testWarehouse.id,
        period: '2024-03',
        quantity: 10,
      });
      const record2 = await ctx.client.leftovers.create(ctx.shopContext, {
        sku_id: testSku.id,
        warehouse_id: testWarehouse.id,
        period: '2024-04',
        quantity: 20,
      });

      const filtered = await ctx.client.leftovers.getAll(ctx.shopContext, {
        ids: [record1.id, record2.id],
      });

      expect(filtered.items.length).toBe(2);
      expect(filtered.items.map((r) => r.id)).toContain(record1.id);
      expect(filtered.items.map((r) => r.id)).toContain(record2.id);
      expect(filtered.total).toBe(2);
    });

    it('should filter by period range', async () => {
      const [periodFrom, periodTo] = generateTestPeriodRange();

      const rangeWarehouse = await ctx.client.warehouses.create(ctx.shopContext, {
        code: generateTestCode('WH-RANGE'),
        title: 'Range Test WH',
      });

      await ctx.client.leftovers.create(ctx.shopContext, {
        sku_id: skuId,
        warehouse_id: rangeWarehouse.id,
        period: periodFrom,
        quantity: 50,
      });
      await ctx.client.leftovers.create(ctx.shopContext, {
        sku_id: skuId,
        warehouse_id: rangeWarehouse.id,
        period: periodTo,
        quantity: 60,
      });

      const records = await ctx.client.leftovers.getAll(ctx.shopContext, {
        period_from: periodFrom,
        period_to: periodTo,
      });

      expect(Array.isArray(records.items)).toBe(true);
      records.items.forEach((r) => {
        expect(r.period >= periodFrom && r.period <= periodTo).toBe(true);
      });
    });

    it('should get leftover by id', async () => {
      const record = await ctx.client.leftovers.getById(ctx.shopContext, leftoverId);

      expect(record.id).toBe(leftoverId);
    });

    it('should update leftover', async () => {
      const record = await ctx.client.leftovers.update(ctx.shopContext, leftoverId, {
        quantity: 150,
      });

      expect(record.quantity).toBe(150);
    });

    it('should return 409 on duplicate (warehouse, sku, period)', async () => {
      const testPeriod = generateTestPeriod();
      const uniqueWarehouse = await ctx.client.warehouses.create(ctx.shopContext, {
        code: generateTestCode('WH-DUP'),
        title: 'Duplicate Test WH',
      });

      await ctx.client.leftovers.create(ctx.shopContext, {
        sku_id: skuId,
        warehouse_id: uniqueWarehouse.id,
        period: testPeriod,
        quantity: 10,
      });

      await expectConflict(() =>
        ctx.client.leftovers.create(ctx.shopContext, {
          sku_id: skuId,
          warehouse_id: uniqueWarehouse.id,
          period: testPeriod,
          quantity: 20,
        }),
      );
    });

    it('should delete leftover', async () => {
      const testPeriod = generateTestPeriod();
      const deleteWarehouse = await ctx.client.warehouses.create(ctx.shopContext, {
        code: generateTestCode('WH-DEL'),
        title: 'Delete Test WH',
      });

      const record = await ctx.client.leftovers.create(ctx.shopContext, {
        sku_id: skuId,
        warehouse_id: deleteWarehouse.id,
        period: testPeriod,
        quantity: 10,
      });

      await ctx.client.leftovers.delete(ctx.shopContext, record.id);

      // Verify deletion by trying to get it
      try {
        await ctx.client.leftovers.getById(ctx.shopContext, record.id);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as { status: number }).status).toBe(404);
      }
    });
  });

  describe('Import/Export', () => {
    it('should import leftovers from JSON', async () => {
      const importWarehouse = await ctx.client.warehouses.create(ctx.shopContext, {
        code: generateTestCode('WH-IMP'),
        title: 'Import Test WH',
      });
      const importSku = await ctx.client.skus.create(ctx.shopContext, {
        code: generateTestCode('SKU-IMP'),
        title: 'Import Test SKU',
      });

      const result = await ctx.client.leftovers.importJson(ctx.shopContext, [
        {
          warehouse: importWarehouse.code,
          sku: importSku.code,
          period: '2025-01',
          quantity: 100,
        },
        {
          warehouse: importWarehouse.code,
          sku: importSku.code,
          period: '2025-02',
          quantity: 200,
        },
      ]);

      expect(result.created).toBe(2);
    });

    it('should export leftovers to JSON', async () => {
      const items = await ctx.client.leftovers.exportJson(ctx.shopContext);

      expect(Array.isArray(items)).toBe(true);
      if (items.length > 0) {
        expect(items[0]).toHaveProperty('warehouse');
        expect(items[0]).toHaveProperty('sku');
        expect(items[0]).toHaveProperty('period');
        expect(items[0]).toHaveProperty('quantity');
      }
    });

    it('should import leftovers from CSV', async () => {
      const csvWarehouse = await ctx.client.warehouses.create(ctx.shopContext, {
        code: generateTestCode('WH-CSV'),
        title: 'CSV Test WH',
      });
      const csvSku = await ctx.client.skus.create(ctx.shopContext, {
        code: generateTestCode('SKU-CSV'),
        title: 'CSV Test SKU',
      });

      const csv = `warehouse;sku;period;quantity
${csvWarehouse.code};${csvSku.code};2025-03;300
${csvWarehouse.code};${csvSku.code};2025-04;400`;

      const result = await ctx.client.leftovers.importCsv(ctx.shopContext, csv);

      expect(result.created).toBe(2);
    });

    it('should export leftovers to CSV', async () => {
      const csv = await ctx.client.leftovers.exportCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('warehouse');
      expect(csv).toContain('sku');
      expect(csv).toContain('period');
      expect(csv).toContain('quantity');
    });

    it('should auto-create missing SKUs and warehouses on import', async () => {
      // Get initial counts
      const skusBefore = await ctx.client.skus.getAll(ctx.shopContext);
      const warehousesBefore = await ctx.client.warehouses.getAll(ctx.shopContext);

      const skuCode = `newsku${generateUniqueId()}`;
      const warehouseCode = `newwh${generateUniqueId()}`;
      const result = await ctx.client.leftovers.importJson(ctx.shopContext, [
        {
          warehouse: warehouseCode,
          sku: skuCode,
          period: '2025-05',
          quantity: 50,
        },
      ]);

      expect(result.created).toBe(1);

      // Verify auto-created entities exist with correct data
      const skusAfter = await ctx.client.skus.getAll(ctx.shopContext);
      expect(skusAfter.total).toBe(skusBefore.total + 1);
      const newSku = skusAfter.items.find((s) => !skusBefore.items.some((b) => b.id === s.id));
      expect(newSku).toBeDefined();
      // Code is normalized, title defaults to normalized code
      expect(newSku?.code).toContain('newsku');
      expect(newSku?.title).toBe(newSku?.code);

      const warehousesAfter = await ctx.client.warehouses.getAll(ctx.shopContext);
      expect(warehousesAfter.total).toBe(warehousesBefore.total + 1);
      const newWarehouse = warehousesAfter.items.find(
        (w) => !warehousesBefore.items.some((b) => b.id === w.id),
      );
      expect(newWarehouse).toBeDefined();
      expect(newWarehouse?.code).toContain('newwh');
      expect(newWarehouse?.title).toBe(newWarehouse?.code);
    });
  });
});
