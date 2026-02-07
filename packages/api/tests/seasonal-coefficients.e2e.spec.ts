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
  generateUniqueId,
} from './test-helpers.js';

describe('Seasonal Coefficients (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let groupId: number;
  let coefficientId: number;

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
      userEmail: `seasonal-test-${generateUniqueId()}@example.com`,
      userName: 'Seasonal Test User',
    });

    // Create test group
    const group = await ctx.client.groups.create(ctx.shopContext, {
      code: generateTestCode('GRP-SEASONAL'),
      title: 'Test Group for Seasonal',
    });
    groupId = group.id;
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.seasonalCoefficients.getAll(ctx.shopContext));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.seasonalCoefficients.getAll(ctx.shopContext));
    });
  });

  describe('CRUD operations', () => {
    it('should create seasonal coefficient', async () => {
      const record = await ctx.client.seasonalCoefficients.create(ctx.shopContext, {
        group_id: groupId,
        month: 1,
        coefficient: 1.25,
      });

      expect(record).toHaveProperty('id');
      expect(record.group_id).toBe(groupId);
      expect(record.month).toBe(1);
      expect(record.coefficient).toBe(1.25);
      expect(record.shop_id).toBe(ctx.shop.id);
      expect(record.tenant_id).toBe(ctx.tenant.id);

      coefficientId = record.id;
    });

    it('should list seasonal coefficients', async () => {
      const records = await ctx.client.seasonalCoefficients.getAll(ctx.shopContext);

      expect(Array.isArray(records.items)).toBe(true);
      expect(records.items.length).toBeGreaterThan(0);
    });

    it('should get seasonal coefficient by id', async () => {
      const record = await ctx.client.seasonalCoefficients.getById(ctx.shopContext, coefficientId);

      expect(record.id).toBe(coefficientId);
    });

    it('should update seasonal coefficient', async () => {
      const record = await ctx.client.seasonalCoefficients.update(ctx.shopContext, coefficientId, {
        coefficient: 1.5,
      });

      expect(record.coefficient).toBe(1.5);
    });

    it('should return 409 on duplicate (group, month)', async () => {
      const uniqueGroup = await ctx.client.groups.create(ctx.shopContext, {
        code: generateTestCode('GRP-DUP'),
        title: 'Duplicate Test Group',
      });

      await ctx.client.seasonalCoefficients.create(ctx.shopContext, {
        group_id: uniqueGroup.id,
        month: 6,
        coefficient: 1.0,
      });

      await expectConflict(() =>
        ctx.client.seasonalCoefficients.create(ctx.shopContext, {
          group_id: uniqueGroup.id,
          month: 6,
          coefficient: 1.1,
        }),
      );
    });

    it('should delete seasonal coefficient', async () => {
      const deleteGroup = await ctx.client.groups.create(ctx.shopContext, {
        code: generateTestCode('GRP-DEL'),
        title: 'Delete Test Group',
      });

      const record = await ctx.client.seasonalCoefficients.create(ctx.shopContext, {
        group_id: deleteGroup.id,
        month: 12,
        coefficient: 0.8,
      });

      await ctx.client.seasonalCoefficients.delete(ctx.shopContext, record.id);

      // Verify deletion
      try {
        await ctx.client.seasonalCoefficients.getById(ctx.shopContext, record.id);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as { status: number }).status).toBe(404);
      }
    });
  });

  describe('Import/Export', () => {
    it('should import seasonal coefficients from JSON', async () => {
      const importGroup = await ctx.client.groups.create(ctx.shopContext, {
        code: generateTestCode('GRP-IMP'),
        title: 'Import Test Group',
      });

      const result = await ctx.client.seasonalCoefficients.importJson(ctx.shopContext, [
        { group: importGroup.code, month: 1, coefficient: 1.1 },
        { group: importGroup.code, month: 2, coefficient: 1.2 },
        { group: importGroup.code, month: 3, coefficient: 1.3 },
      ]);

      expect(result.created).toBe(3);
    });

    it('should export seasonal coefficients to JSON', async () => {
      const items = await ctx.client.seasonalCoefficients.exportJson(ctx.shopContext);

      expect(Array.isArray(items)).toBe(true);
      if (items.length > 0) {
        expect(items[0]).toHaveProperty('group');
        expect(items[0]).toHaveProperty('month');
        expect(items[0]).toHaveProperty('coefficient');
      }
    });

    it('should import seasonal coefficients from CSV', async () => {
      const csvGroup = await ctx.client.groups.create(ctx.shopContext, {
        code: generateTestCode('GRP-CSV'),
        title: 'CSV Test Group',
      });

      const csv = `month;group;coefficient
4;${csvGroup.code};0.9
5;${csvGroup.code};1.0
6;${csvGroup.code};1.1`;

      const result = await ctx.client.seasonalCoefficients.importCsv(ctx.shopContext, csv);

      expect(result.created).toBe(3);
    });

    it('should export seasonal coefficients to CSV', async () => {
      const csv = await ctx.client.seasonalCoefficients.exportCsv(ctx.shopContext);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('group');
      expect(csv).toContain('month');
      expect(csv).toContain('coefficient');
    });
  });
});
