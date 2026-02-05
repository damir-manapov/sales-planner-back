import 'dotenv/config';
import pg from 'pg';
import { config } from 'dotenv';

// Load .env.local first, then .env
config({ path: '.env.local' });
config({ path: '.env' });

const migrations = `
-- 002_create_categories.sql
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, code)
);

CREATE INDEX IF NOT EXISTS idx_categories_shop_id ON categories(shop_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_code ON categories(code);

-- 003_create_groups.sql
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, code)
);

CREATE INDEX IF NOT EXISTS idx_groups_shop_id ON groups(shop_id);
CREATE INDEX IF NOT EXISTS idx_groups_tenant_id ON groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_groups_code ON groups(code);

-- 004_create_statuses.sql
CREATE TABLE IF NOT EXISTS statuses (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, code)
);

CREATE INDEX IF NOT EXISTS idx_statuses_shop_id ON statuses(shop_id);
CREATE INDEX IF NOT EXISTS idx_statuses_tenant_id ON statuses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_statuses_code ON statuses(code);

-- 005_add_sku_classifications.sql
ALTER TABLE skus ADD COLUMN IF NOT EXISTS category_code VARCHAR(100);
ALTER TABLE skus ADD COLUMN IF NOT EXISTS group_code VARCHAR(100);
ALTER TABLE skus ADD COLUMN IF NOT EXISTS status_code VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_skus_category_code ON skus(category_code);
CREATE INDEX IF NOT EXISTS idx_skus_group_code ON skus(group_code);
CREATE INDEX IF NOT EXISTS idx_skus_status_code ON skus(status_code);
`;

async function migrate() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  const parsed = new URL(url);
  const ssl = parsed.searchParams.get('sslmode') === 'require';

  console.log(`Connecting to database: ${parsed.hostname}:${parsed.port}${parsed.pathname}`);

  const pool = new pg.Pool({
    connectionString: url,
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
  });

  console.log('Running new migrations (002-005)...');
  await pool.query(migrations);
  console.log('✅ All new migrations completed!');

  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
