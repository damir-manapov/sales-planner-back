import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { TestContext } from './test-context.js';
import { generateUniqueId } from './test-helpers.js';

describe('Metadata (e2e)', () => {
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
      userEmail: `metadata-test-${generateUniqueId()}@example.com`,
      userName: 'Metadata Test User',
    });
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app?.close();
  });

  describe('GET /metadata/entities', () => {
    it('should return entities metadata', async () => {
      const response = await ctx.client.metadata.getEntitiesMetadata();

      expect(response).toBeDefined();
      expect(response.brands).toBeDefined();
      expect(response.brands.name).toBe('Brands');
      expect(response.brands.description).toContain('brand');
      expect(response.brands.fields).toHaveLength(2);
      expect(response.brands.fields[0]?.name).toBe('code');
      expect(response.brands.fields[0]?.type).toBe('string');
      expect(response.brands.fields[0]?.required).toBe(true);

      expect(response.categories).toBeDefined();
      expect(response.categories.name).toBe('Categories');
      expect(response.categories.fields).toHaveLength(2);

      expect(response.groups).toBeDefined();
      expect(response.groups.name).toBe('Groups');
      expect(response.groups.fields).toHaveLength(2);

      expect(response.statuses).toBeDefined();
      expect(response.statuses.name).toBe('Statuses');
      expect(response.statuses.fields).toHaveLength(2);

      expect(response.suppliers).toBeDefined();
      expect(response.suppliers.name).toBe('Suppliers');
      expect(response.suppliers.fields).toHaveLength(2);

      expect(response.marketplaces).toBeDefined();
      expect(response.marketplaces.name).toBe('Marketplaces');
      expect(response.marketplaces.fields).toHaveLength(2);

      expect(response.skus).toBeDefined();
      expect(response.skus.name).toBe('Products');
      expect(response.skus.fields).toHaveLength(6);

      expect(response.salesHistory).toBeDefined();
      expect(response.salesHistory.name).toBe('Sales History');
      expect(response.salesHistory.fields).toHaveLength(4);
      expect(response.salesHistory.fields.find((f) => f.name === 'period')?.type).toBe('period');
      expect(response.salesHistory.fields.find((f) => f.name === 'quantity')?.type).toBe('number');
    });
  });
});
