import { type INestApplication } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DatabaseService } from '../src/database/database.service.js';
import type { DB } from '../src/database/database.types.js';

/**
 * System admin key for test authentication
 */
export const SYSTEM_ADMIN_KEY = process.env.SYSTEM_ADMIN_KEY ?? '';

/**
 * Get database instance from the app
 */
function getDb(app: INestApplication): Kysely<DB> {
  return app.get(DatabaseService);
}

/**
 * Delete a user and all related data (tenants, shops, skus, sales_history, api_keys, user_roles)
 * This is the main cleanup function - it cascades through all related entities
 */
export async function cleanupUser(app: INestApplication, userId: number): Promise<void> {
  const db = getDb(app);

  // Find all tenants owned or created by this user
  const tenants = await db
    .selectFrom('tenants')
    .select('id')
    .where((eb) => eb.or([eb('owner_id', '=', userId), eb('created_by', '=', userId)]))
    .execute();

  // Delete all tenants and their data
  for (const tenant of tenants) {
    // Get all shops for this tenant
    const shops = await db
      .selectFrom('shops')
      .select('id')
      .where('tenant_id', '=', tenant.id)
      .execute();

    // Delete shop data
    for (const shop of shops) {
      await db.deleteFrom('sales_history').where('shop_id', '=', shop.id).execute();
      await db.deleteFrom('skus').where('shop_id', '=', shop.id).execute();
      await db.deleteFrom('marketplaces').where('shop_id', '=', shop.id).execute();
      await db.deleteFrom('shops').where('id', '=', shop.id).execute();
    }

    // Delete tenant user roles and tenant itself
    await db.deleteFrom('user_roles').where('tenant_id', '=', tenant.id).execute();
    await db.deleteFrom('tenants').where('id', '=', tenant.id).execute();
  }

  // Delete user's API keys, roles, and the user
  await db.deleteFrom('api_keys').where('user_id', '=', userId).execute();
  await db.deleteFrom('user_roles').where('user_id', '=', userId).execute();
  await db.deleteFrom('users').where('id', '=', userId).execute();
}
