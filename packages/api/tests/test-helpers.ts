import { type INestApplication } from '@nestjs/common';
import { Kysely } from 'kysely';
import request from 'supertest';
import type { DB } from '../src/database/database.types.js';
import { DatabaseService } from '../src/database/database.service.js';

/**
 * System admin key for test authentication
 */
export const SYSTEM_ADMIN_KEY = process.env.SYSTEM_ADMIN_KEY ?? '';

/**
 * Test cleanup helpers that directly manipulate the database
 * to avoid foreign key constraint violations during cleanup
 */

export async function getDb(app: INestApplication): Promise<Kysely<DB>> {
  return app.get(DatabaseService);
}

/**
 * Delete all SKUs for a shop
 */
export async function cleanupSkusForShop(app: INestApplication, shopId: number): Promise<void> {
  const db = await getDb(app);
  await db.deleteFrom('skus').where('shop_id', '=', shopId).execute();
}

/**
 * Delete all sales history for a shop
 */
export async function cleanupSalesHistoryForShop(
  app: INestApplication,
  shopId: number,
): Promise<void> {
  const db = await getDb(app);
  await db.deleteFrom('sales_history').where('shop_id', '=', shopId).execute();
}

/**
 * Delete a shop and all its related data
 */
export async function cleanupShop(app: INestApplication, shopId: number): Promise<void> {
  await cleanupSalesHistoryForShop(app, shopId);
  await cleanupSkusForShop(app, shopId);
  const db = await getDb(app);
  await db.deleteFrom('shops').where('id', '=', shopId).execute();
}

/**
 * Delete all shops for a tenant
 */
export async function cleanupShopsForTenant(
  app: INestApplication,
  tenantId: number,
): Promise<void> {
  const db = await getDb(app);
  const shops = await db
    .selectFrom('shops')
    .select('id')
    .where('tenant_id', '=', tenantId)
    .execute();

  for (const shop of shops) {
    await cleanupShop(app, shop.id);
  }
}

/**
 * Delete a tenant and all its related data
 */
export async function cleanupTenant(app: INestApplication, tenantId: number): Promise<void> {
  const db = await getDb(app);

  // Delete all shops and their data for this tenant
  await cleanupShopsForTenant(app, tenantId);

  // Delete user roles for this tenant
  await db.deleteFrom('user_roles').where('tenant_id', '=', tenantId).execute();

  // Delete the tenant
  await db.deleteFrom('tenants').where('id', '=', tenantId).execute();
}

/**
 * Delete a user and all tenants they own/created
 */
export async function cleanupUser(app: INestApplication, userId: number): Promise<void> {
  const db = await getDb(app);

  // Find all tenants owned or created by this user
  const tenants = await db
    .selectFrom('tenants')
    .select('id')
    .where((eb) => eb.or([eb('owner_id', '=', userId), eb('created_by', '=', userId)]))
    .execute();

  // Delete all tenants and their data
  for (const tenant of tenants) {
    await cleanupTenant(app, tenant.id);
  }

  // Delete API keys for this user
  await db.deleteFrom('api_keys').where('user_id', '=', userId).execute();

  // Delete user roles
  await db.deleteFrom('user_roles').where('user_id', '=', userId).execute();

  // Delete the user
  await db.deleteFrom('users').where('id', '=', userId).execute();
}

/**
 * Comprehensive cleanup that handles multiple entities
 */
export async function cleanupTestData(
  app: INestApplication,
  data: {
    userIds?: number[];
    tenantIds?: number[];
    shopIds?: number[];
    skuIds?: number[];
  },
): Promise<void> {
  // Clean SKUs first
  if (data.skuIds?.length) {
    const db = await getDb(app);
    for (const skuId of data.skuIds) {
      await db.deleteFrom('skus').where('id', '=', skuId).execute();
    }
  }

  // Clean shops
  if (data.shopIds?.length) {
    for (const shopId of data.shopIds) {
      await cleanupShop(app, shopId);
    }
  }

  // Clean tenants
  if (data.tenantIds?.length) {
    for (const tenantId of data.tenantIds) {
      await cleanupTenant(app, tenantId);
    }
  }

  // Clean users last
  if (data.userIds?.length) {
    for (const userId of data.userIds) {
      await cleanupUser(app, userId);
    }
  }
}

/**
 * Test setup helpers that use API calls for creating test data
 */

export interface UserWithApiKey {
  userId: number;
  apiKey: string;
  email: string;
  name: string;
}

/**
 * Create a user with an API key for testing
 */
export async function createUserWithApiKey(
  app: INestApplication,
  email: string,
  name: string,
): Promise<UserWithApiKey> {
  const userRes = await request(app.getHttpServer())
    .post('/users')
    .set('X-API-Key', SYSTEM_ADMIN_KEY)
    .send({ email, name });

  const userId = userRes.body.id;
  const apiKey = `test-key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await request(app.getHttpServer())
    .post('/api-keys')
    .set('X-API-Key', SYSTEM_ADMIN_KEY)
    .send({ user_id: userId, key: apiKey, name: `${name} Key` });

  return { userId, apiKey, email, name };
}

/**
 * Create a tenant with a specific owner
 */
export async function createTenantWithOwner(
  app: INestApplication,
  title: string,
  ownerId: number,
): Promise<{ tenantId: number; title: string }> {
  const res = await request(app.getHttpServer())
    .post('/tenants')
    .set('X-API-Key', SYSTEM_ADMIN_KEY)
    .send({ title, owner_id: ownerId });

  return { tenantId: res.body.id, title: res.body.title };
}

/**
 * Create a shop in a tenant
 */
export async function createShop(
  app: INestApplication,
  title: string,
  tenantId: number,
): Promise<{ shopId: number; title: string }> {
  const res = await request(app.getHttpServer())
    .post('/shops')
    .set('X-API-Key', SYSTEM_ADMIN_KEY)
    .send({ title, tenant_id: tenantId });

  return { shopId: res.body.id, title: res.body.title };
}

/**
 * Get or create a role by name
 */
export async function getOrCreateRole(
  app: INestApplication,
  name: string,
  description: string,
): Promise<number> {
  const rolesRes = await request(app.getHttpServer())
    .get('/roles')
    .set('X-API-Key', SYSTEM_ADMIN_KEY);

  let roleId = rolesRes.body.find((r: { name: string }) => r.name === name)?.id;

  if (!roleId) {
    const roleRes = await request(app.getHttpServer())
      .post('/roles')
      .set('X-API-Key', SYSTEM_ADMIN_KEY)
      .send({ name, description });
    roleId = roleRes.body.id;
  }

  return roleId;
}

/**
 * Assign a role to a user
 */
export async function assignRole(
  app: INestApplication,
  userId: number,
  roleId: number,
  options?: { tenantId?: number; shopId?: number },
): Promise<void> {
  await request(app.getHttpServer()).post('/user-roles').set('X-API-Key', SYSTEM_ADMIN_KEY).send({
    user_id: userId,
    role_id: roleId,
    tenant_id: options?.tenantId,
    shop_id: options?.shopId,
  });
}
