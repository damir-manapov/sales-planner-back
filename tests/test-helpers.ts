import { type INestApplication } from '@nestjs/common';
import { Kysely } from 'kysely';
import type { Database } from '../src/db/index.js';
import { DatabaseService } from '../src/database/database.service.js';

/**
 * Test cleanup helpers that directly manipulate the database
 * to avoid foreign key constraint violations during cleanup
 */

export async function getDb(app: INestApplication): Promise<Kysely<Database>> {
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
  const shops = await db.selectFrom('shops').select('id').where('tenant_id', '=', tenantId).execute();

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
