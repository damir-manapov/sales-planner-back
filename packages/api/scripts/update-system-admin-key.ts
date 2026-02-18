#!/usr/bin/env bun
import 'dotenv/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { DB } from '../src/database/database.types.js';
import { randomUUID } from 'node:crypto';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is required');
  process.exit(1);
}

const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
    }),
  }),
});

async function updateSystemAdminKey() {
  console.log('🔑 Updating system admin API key...');

  // Get the existing system admin key or generate new one
  const newApiKey = process.env.SYSTEM_ADMIN_KEY || randomUUID();

  // Find system admin user
  const systemAdmin = await db
    .selectFrom('users')
    .innerJoin('user_roles', 'users.id', 'user_roles.userId')
    .innerJoin('roles', 'user_roles.roleId', 'roles.id')
    .select(['users.id', 'users.email'])
    .where('roles.name', '=', 'systemAdmin')
    .where('user_roles.tenantId', 'is', null)
    .where('user_roles.shopId', 'is', null)
    .executeTakeFirst();

  if (!systemAdmin) {
    console.error('❌ No system admin user found');
    process.exit(1);
  }

  console.log(`   Found system admin: ${systemAdmin.email} (ID: ${systemAdmin.id})`);

  // Update or insert API key
  const existingKey = await db
    .selectFrom('api_keys')
    .select('key')
    .where('userId', '=', systemAdmin.id)
    .executeTakeFirst();

  if (existingKey) {
    await db
      .updateTable('api_keys')
      .set({ key: newApiKey })
      .where('userId', '=', systemAdmin.id)
      .execute();
    console.log('   ✅ Updated existing API key');
  } else {
    await db
      .insertInto('api_keys')
      .values({
        key: newApiKey,
        userId: systemAdmin.id,
        expiresAt: null,
      })
      .execute();
    console.log('   ✅ Created new API key');
  }

  console.log(`\n🎉 System admin API key: ${newApiKey}`);
  console.log('\nAdd this to your .env file:');
  console.log(`SYSTEM_ADMIN_KEY="${newApiKey}"`);

  await db.destroy();
}

updateSystemAdminKey().catch((error) => {
  console.error('❌ Error updating system admin key:', error);
  process.exit(1);
});
