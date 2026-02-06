import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ROLE_NAMES } from '../src/common/constants.js';
import { TestContext } from './test-context.js';
import {
  cleanupUser,
  expectForbidden,
  expectNotFound,
  expectUnauthorized,
  generateUniqueId,
} from './test-helpers.js';

describe('User Roles (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let ctx: TestContext;
  let editorRoleId: number;
  let viewerRoleId: number;

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
      tenantTitle: `User Roles Test Tenant ${generateUniqueId()}`,
      userEmail: `user-roles-test-${generateUniqueId()}@example.com`,
      userName: 'User Roles Test User',
    });

    // Get role IDs
    const roles = await ctx.getSystemClient().roles.getAll();
    const editorRole = roles.find((r) => r.name === ROLE_NAMES.EDITOR);
    const viewerRole = roles.find((r) => r.name === ROLE_NAMES.VIEWER);
    if (!editorRole || !viewerRole) throw new Error('Required roles not found');
    editorRoleId = editorRole.id;
    viewerRoleId = viewerRole.id;
  });

  afterAll(async () => {
    if (ctx) await ctx.dispose();
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const noAuthClient = new SalesPlannerClient({ baseUrl, apiKey: '' });
      await expectUnauthorized(() => noAuthClient.userRoles.getAll({ tenantId: ctx.tenant.id }));
    });

    it('should return 401 with invalid API key', async () => {
      const badClient = new SalesPlannerClient({ baseUrl, apiKey: 'invalid-key' });
      await expectUnauthorized(() => badClient.userRoles.getAll({ tenantId: ctx.tenant.id }));
    });
  });

  describe('Tenant Owner managing user roles', () => {
    let targetUserId: number;
    let createdUserRoleId: number;

    beforeAll(async () => {
      // Create a user to assign roles to
      const targetUser = await ctx.getSystemClient().users.create({
        email: `target-user-${generateUniqueId()}@example.com`,
        name: 'Target User',
      });
      targetUserId = targetUser.id;
    });

    afterAll(async () => {
      if (targetUserId) await cleanupUser(app, targetUserId);
    });

    it('tenant owner should list user roles for their tenant', async () => {
      const userRoles = await ctx.client.userRoles.getAll({ tenantId: ctx.tenant.id });

      expect(Array.isArray(userRoles)).toBe(true);
    });

    it('tenant owner should assign editor role to user in their tenant', async () => {
      const userRole = await ctx.client.userRoles.create({
        user_id: targetUserId,
        role_id: editorRoleId,
        tenant_id: ctx.tenant.id,
        shop_id: ctx.shop.id,
      });

      expect(userRole).toHaveProperty('id');
      expect(userRole.user_id).toBe(targetUserId);
      expect(userRole.role_id).toBe(editorRoleId);
      expect(userRole.tenant_id).toBe(ctx.tenant.id);
      expect(userRole.shop_id).toBe(ctx.shop.id);

      createdUserRoleId = userRole.id;
    });

    it('tenant owner should get user role by id', async () => {
      const userRole = await ctx.client.userRoles.getById(createdUserRoleId);

      expect(userRole.id).toBe(createdUserRoleId);
      expect(userRole.user_id).toBe(targetUserId);
    });

    it('tenant owner should assign viewer role to same user', async () => {
      const userRole = await ctx.client.userRoles.create({
        user_id: targetUserId,
        role_id: viewerRoleId,
        tenant_id: ctx.tenant.id,
        shop_id: ctx.shop.id,
      });

      expect(userRole.role_id).toBe(viewerRoleId);
    });

    it('tenant owner should delete user role', async () => {
      await ctx.client.userRoles.delete(createdUserRoleId);
      await expectNotFound(() => ctx.client.userRoles.getById(createdUserRoleId));
    });
  });

  describe('Tenant Admin managing user roles', () => {
    let tenantAdminClient: SalesPlannerClient;
    let tenantAdminUserId: number;
    let targetUserId: number;
    let adminCreatedRoleId: number;

    beforeAll(async () => {
      // Create tenant admin user
      const adminUser = await ctx.getSystemClient().users.create({
        email: `tenant-admin-${generateUniqueId()}@example.com`,
        name: 'Tenant Admin User',
      });
      tenantAdminUserId = adminUser.id;

      const adminApiKey = await ctx.getSystemClient().apiKeys.create({
        user_id: tenantAdminUserId,
        name: 'Admin Key',
      });
      tenantAdminClient = new SalesPlannerClient({ baseUrl, apiKey: adminApiKey.key });

      // Assign tenant admin role
      const roles = await ctx.getSystemClient().roles.getAll();
      const tenantAdminRole = roles.find((r) => r.name === ROLE_NAMES.TENANT_ADMIN);
      if (!tenantAdminRole) throw new Error('Tenant Admin role not found');
      await ctx.getSystemClient().userRoles.create({
        user_id: tenantAdminUserId,
        role_id: tenantAdminRole.id,
        tenant_id: ctx.tenant.id,
      });

      // Create target user
      const targetUser = await ctx.getSystemClient().users.create({
        email: `admin-target-${generateUniqueId()}@example.com`,
        name: 'Admin Target User',
      });
      targetUserId = targetUser.id;
    });

    afterAll(async () => {
      if (tenantAdminUserId) await cleanupUser(app, tenantAdminUserId);
      if (targetUserId) await cleanupUser(app, targetUserId);
    });

    it('tenant admin should list user roles for their tenant', async () => {
      const userRoles = await tenantAdminClient.userRoles.getAll({ tenantId: ctx.tenant.id });

      expect(Array.isArray(userRoles)).toBe(true);
    });

    it('tenant admin should assign role to user in their tenant', async () => {
      const userRole = await tenantAdminClient.userRoles.create({
        user_id: targetUserId,
        role_id: editorRoleId,
        tenant_id: ctx.tenant.id,
        shop_id: ctx.shop.id,
      });

      expect(userRole).toHaveProperty('id');
      expect(userRole.user_id).toBe(targetUserId);

      adminCreatedRoleId = userRole.id;
    });

    it('tenant admin should get user role by id', async () => {
      const userRole = await tenantAdminClient.userRoles.getById(adminCreatedRoleId);

      expect(userRole.id).toBe(adminCreatedRoleId);
    });

    it('tenant admin should delete user role in their tenant', async () => {
      await tenantAdminClient.userRoles.delete(adminCreatedRoleId);
      await expectNotFound(() => tenantAdminClient.userRoles.getById(adminCreatedRoleId));
    });
  });

  describe('Cross-tenant access control', () => {
    let otherCtx: TestContext;
    let otherUserRoleId: number;

    beforeAll(async () => {
      otherCtx = await TestContext.create(app, baseUrl, {
        tenantTitle: `Other Tenant ${generateUniqueId()}`,
        userEmail: `other-tenant-${generateUniqueId()}@example.com`,
        userName: 'Other Tenant User',
      });

      // Create a user role in other tenant
      const targetUser = await ctx.getSystemClient().users.create({
        email: `other-target-${generateUniqueId()}@example.com`,
        name: 'Other Target',
      });

      const userRole = await otherCtx.client.userRoles.create({
        user_id: targetUser.id,
        role_id: viewerRoleId,
        tenant_id: otherCtx.tenant.id,
        shop_id: otherCtx.shop.id,
      });
      otherUserRoleId = userRole.id;
    });

    afterAll(async () => {
      if (otherCtx) await otherCtx.dispose();
    });

    it('should return 403 when listing roles for other tenant', async () => {
      await expectForbidden(() => ctx.client.userRoles.getAll({ tenantId: otherCtx.tenant.id }));
    });

    it('should return 403 when getting user role from other tenant', async () => {
      await expectForbidden(() => ctx.client.userRoles.getById(otherUserRoleId));
    });

    it('should return 403 when creating role in other tenant', async () => {
      const targetUser = await ctx.getSystemClient().users.create({
        email: `cross-target-${generateUniqueId()}@example.com`,
        name: 'Cross Target',
      });

      await expectForbidden(() =>
        ctx.client.userRoles.create({
          user_id: targetUser.id,
          role_id: editorRoleId,
          tenant_id: otherCtx.tenant.id,
          shop_id: otherCtx.shop.id,
        }),
      );
    });

    it('should return 403 when deleting role from other tenant', async () => {
      await expectForbidden(() => ctx.client.userRoles.delete(otherUserRoleId));
    });
  });

  describe('Editor/Viewer role restrictions', () => {
    let editorClient: SalesPlannerClient;
    let editorUserId: number;
    let viewerClient: SalesPlannerClient;
    let viewerUserId: number;

    beforeAll(async () => {
      // Create editor user
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

      await ctx.getSystemClient().userRoles.create({
        user_id: editorUserId,
        role_id: editorRoleId,
        tenant_id: ctx.tenant.id,
        shop_id: ctx.shop.id,
      });

      // Create viewer user
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

      await ctx.getSystemClient().userRoles.create({
        user_id: viewerUserId,
        role_id: viewerRoleId,
        tenant_id: ctx.tenant.id,
        shop_id: ctx.shop.id,
      });
    });

    afterAll(async () => {
      if (editorUserId) await cleanupUser(app, editorUserId);
      if (viewerUserId) await cleanupUser(app, viewerUserId);
    });

    it('editor should NOT list user roles (requires tenant admin)', async () => {
      await expectForbidden(() => editorClient.userRoles.getAll({ tenantId: ctx.tenant.id }));
    });

    it('editor should NOT create user roles', async () => {
      const targetUser = await ctx.getSystemClient().users.create({
        email: `editor-target-${generateUniqueId()}@example.com`,
        name: 'Editor Target',
      });

      await expectForbidden(() =>
        editorClient.userRoles.create({
          user_id: targetUser.id,
          role_id: viewerRoleId,
          tenant_id: ctx.tenant.id,
          shop_id: ctx.shop.id,
        }),
      );
    });

    it('viewer should NOT list user roles (requires tenant admin)', async () => {
      await expectForbidden(() => viewerClient.userRoles.getAll({ tenantId: ctx.tenant.id }));
    });

    it('viewer should NOT create user roles', async () => {
      const targetUser = await ctx.getSystemClient().users.create({
        email: `viewer-target-${generateUniqueId()}@example.com`,
        name: 'Viewer Target',
      });

      await expectForbidden(() =>
        viewerClient.userRoles.create({
          user_id: targetUser.id,
          role_id: viewerRoleId,
          tenant_id: ctx.tenant.id,
          shop_id: ctx.shop.id,
        }),
      );
    });
  });

  describe('System Admin access', () => {
    let targetUserId: number;
    let systemCreatedRoleId: number;

    beforeAll(async () => {
      const targetUser = await ctx.getSystemClient().users.create({
        email: `system-target-${generateUniqueId()}@example.com`,
        name: 'System Target',
      });
      targetUserId = targetUser.id;
    });

    afterAll(async () => {
      if (targetUserId) await cleanupUser(app, targetUserId);
    });

    it('system admin should list all user roles', async () => {
      const userRoles = await ctx.getSystemClient().userRoles.getAll();

      expect(Array.isArray(userRoles)).toBe(true);
    });

    it('system admin should list user roles by tenant', async () => {
      const userRoles = await ctx.getSystemClient().userRoles.getAll({ tenantId: ctx.tenant.id });

      expect(Array.isArray(userRoles)).toBe(true);
      userRoles.forEach((ur) => {
        expect(ur.tenant_id).toBe(ctx.tenant.id);
      });
    });

    it('system admin should create user role', async () => {
      const userRole = await ctx.getSystemClient().userRoles.create({
        user_id: targetUserId,
        role_id: editorRoleId,
        tenant_id: ctx.tenant.id,
        shop_id: ctx.shop.id,
      });

      expect(userRole).toHaveProperty('id');
      systemCreatedRoleId = userRole.id;
    });

    it('system admin should delete user role', async () => {
      await ctx.getSystemClient().userRoles.delete(systemCreatedRoleId);
      await expectNotFound(() => ctx.getSystemClient().userRoles.getById(systemCreatedRoleId));
    });
  });
});
