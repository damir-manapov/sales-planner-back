import 'dotenv/config';
import pg from 'pg';
import { config } from 'dotenv';

// Load .env.local first, then .env
config({ path: '.env.local' });
config({ path: '.env' });

async function resetDb() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  const parsed = new URL(url);
  const ssl = parsed.searchParams.get('sslmode') === 'require';

  console.log(`Connecting to database: ${parsed.hostname}:${parsed.port}${parsed.pathname}`);
  console.log('⚠️  WARNING: This will DROP ALL TABLES and data!');

  const pool = new pg.Pool({
    connectionString: url,
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
  });

  // Drop all tables in reverse dependency order
  const tables = [
    'sales_history',
    'skus',
    'marketplaces',
    'user_roles',
    'api_keys',
    'shops',
    'tenants',
    'users',
  ];

  for (const table of tables) {
    try {
      console.log(`Dropping table: ${table}`);
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`✅ Dropped ${table}`);
    } catch (err) {
      console.log(`⚠️  Table ${table} doesn't exist or error: ${err}`);
    }
  }

  await pool.end();
  console.log('\n✅ Database reset complete! Run migrations next with: pnpm db:migrate');
}

resetDb().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
