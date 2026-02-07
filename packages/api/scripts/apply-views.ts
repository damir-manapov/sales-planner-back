/**
 * Apply Materialized Views
 *
 * This script drops and recreates all materialized views.
 * Use when view definitions change.
 *
 * Usage:
 *   npx tsx scripts/apply-views.ts              # Apply all views
 *   npx tsx scripts/apply-views.ts --refresh    # Refresh all views (no recreate)
 *   npx tsx scripts/apply-views.ts --drop       # Drop all views
 */

import 'dotenv/config';
import * as fs from 'node:fs';
import pg from 'pg';
import { config } from 'dotenv';

// Load .env.local first, then .env
config({ path: '.env.local' });
config({ path: '.env' });

// Import from views folder
import { getViewsInOrder, getViewsInReverseOrder, getViewPath } from '../views/index.js';

async function main() {
  const args = process.argv.slice(2);
  const refreshOnly = args.includes('--refresh');
  const dropOnly = args.includes('--drop');

  console.log('🗄️  Applying Materialized Views');
  console.log('');

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  const parsed = new URL(url);
  const ssl = parsed.searchParams.get('sslmode') === 'require';

  console.log(`Connecting to database: ${parsed.hostname}:${parsed.port}${parsed.pathname}`);
  console.log('');

  const pool = new pg.Pool({
    connectionString: url,
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    if (refreshOnly) {
      // Just refresh existing views
      console.log('Refreshing materialized views...');
      const views = getViewsInOrder();

      for (const view of views) {
        process.stdout.write(`  Refreshing ${view.name}... `);
        const start = Date.now();
        await pool.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view.name}`);
        console.log(`done (${Date.now() - start}ms)`);
      }
    } else if (dropOnly) {
      // Just drop views
      console.log('Dropping materialized views...');
      const views = getViewsInReverseOrder();

      for (const view of views) {
        process.stdout.write(`  Dropping ${view.name}... `);
        await pool.query(`DROP MATERIALIZED VIEW IF EXISTS ${view.name} CASCADE`);
        console.log('done');
      }
    } else {
      // Drop and recreate
      console.log('Step 1: Dropping existing views (in reverse order)...');
      const viewsReverse = getViewsInReverseOrder();

      for (const view of viewsReverse) {
        process.stdout.write(`  Dropping ${view.name}... `);
        await pool.query(`DROP MATERIALIZED VIEW IF EXISTS ${view.name} CASCADE`);
        console.log('done');
      }

      console.log('');
      console.log('Step 2: Creating views (in dependency order)...');
      const views = getViewsInOrder();

      for (const view of views) {
        const sqlPath = getViewPath(view);
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        process.stdout.write(`  Creating ${view.name}... `);
        const start = Date.now();
        await pool.query(sql);
        console.log(`done (${Date.now() - start}ms)`);
      }
    }

    console.log('');
    console.log('✅ Done!');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
