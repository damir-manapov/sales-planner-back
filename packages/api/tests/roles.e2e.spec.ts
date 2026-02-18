import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import type { Role } from '@sales-planner/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ROLE_NAMES } from '../src/common/constants.js';
import { TestContext } from './test-context.js';
import { expectUnauthorized, generateUniqueId } from './test-helpers.js';

describe('Roles (e2e)', () => {
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
      tenantTitle: `Roles Test Tenant ${generateUniqueId()}`,
      userEmail: `roles-test-${generateUniqueId()}@example.com`,
      userName: 'Roles Test User',
    });
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.roles.getAll());
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.roles.getAll());
    });
  });

  describe('Listing roles', () => {
    let roles: Role[];

    it('should list all predefined roles', async () => {
      const result = await ctx.client.roles.getAll();

      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThanOrEqual(4);
      roles = result.items;

      // Verify predefined roles exist
      const roleNames = roles.map((r) => r.name);
      expect(roleNames).toContain(ROLE_NAMES.SYSTEM_ADMIN);
      expect(roleNames).toContain(ROLE_NAMES.TENANT_ADMIN);
      expect(roleNames).toContain(ROLE_NAMES.EDITOR);
      expect(roleNames).toContain(ROLE_NAMES.VIEWER);
    });

    it('should get a role by id', async () => {
      const editorRole = roles.find((r) => r.name === ROLE_NAMES.EDITOR);
      if (!editorRole) throw new Error('Editor role not found');
      const role = await ctx.client.roles.getById(editorRole.id);

      expect(role.id).toBe(editorRole.id);
      expect(role.name).toBe(ROLE_NAMES.EDITOR);
    });

    it('should support pagination', async () => {
      const page = await ctx.client.roles.getAll({ limit: 2, offset: 0 });

      expect(page.items.length).toBeLessThanOrEqual(2);
      expect(page.total).toBeGreaterThanOrEqual(4);
      expect(page.limit).toBe(2);
      expect(page.offset).toBe(0);
    });
  });
});
