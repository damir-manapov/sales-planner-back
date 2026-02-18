import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // ── Users ──
  await db.schema
    .createTable('users')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('email', 'varchar(255)', (col) => col.unique().notNull())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('default_shop_id', 'integer')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // ── Tenants ──
  await db.schema
    .createTable('tenants')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('owner_id', 'integer', (col) => col.references('users.id').onDelete('set null'))
    .addColumn('created_by', 'integer', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // ── Shops ──
  await db.schema
    .createTable('shops')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('tenant_id', 'integer', (col) =>
      col.notNull().references('tenants.id').onDelete('cascade'),
    )
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('shops_tenant_id_title_key', ['tenant_id', 'title'])
    .execute();

  // ── Users → Shops FK ──
  await sql`
    ALTER TABLE users ADD CONSTRAINT users_default_shop_id_fkey
      FOREIGN KEY (default_shop_id) REFERENCES shops(id) ON DELETE SET NULL
  `.execute(db);

  // ── Roles ──
  await db.schema
    .createTable('roles')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(50)', (col) => col.unique().notNull())
    .addColumn('description', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await sql`
    INSERT INTO roles (name, description) VALUES
      ('systemAdmin', 'System administrator with full access'),
      ('tenantOwner', 'Tenant owner with full access to tenant resources'),
      ('tenantAdmin', 'Tenant administrator with management access'),
      ('tenantEditor', 'Tenant editor with write access'),
      ('tenantViewer', 'Tenant viewer with read-only access')
    ON CONFLICT (name) DO NOTHING
  `.execute(db);

  // ── API Keys ──
  await db.schema
    .createTable('api_keys')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('key', 'varchar(255)', (col) => col.unique().notNull())
    .addColumn('name', 'varchar(255)')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('last_used_at', 'timestamptz')
    .addColumn('expires_at', 'timestamptz')
    .execute();

  await db.schema.createIndex('idx_api_keys_user_id').on('api_keys').column('user_id').execute();

  // ── User Roles ──
  await db.schema
    .createTable('user_roles')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('role_id', 'integer', (col) =>
      col.notNull().references('roles.id').onDelete('cascade'),
    )
    .addColumn('tenant_id', 'integer', (col) => col.references('tenants.id').onDelete('cascade'))
    .addColumn('shop_id', 'integer', (col) => col.references('shops.id').onDelete('cascade'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('user_roles_user_id_role_id_tenant_id_shop_id_key', [
      'user_id',
      'role_id',
      'tenant_id',
      'shop_id',
    ])
    .execute();

  await db.schema.createIndex('idx_user_roles_user_id').on('user_roles').column('user_id').execute();
  await db.schema.createIndex('idx_user_roles_tenant_id').on('user_roles').column('tenant_id').execute();
  await db.schema.createIndex('idx_user_roles_shop_id').on('user_roles').column('shop_id').execute();

  // ── User Shops ──
  await db.schema
    .createTable('user_shops')
    .addColumn('user_id', 'integer', (col) =>
      col.primaryKey().references('users.id').onDelete('cascade'),
    )
    .addColumn('shop_id', 'integer', (col) =>
      col.notNull().references('shops.id').onDelete('cascade'),
    )
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // ── Marketplaces ──
  await db.schema
    .createTable('marketplaces')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('code', 'varchar(255)', (col) => col.notNull())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('shop_id', 'integer', (col) =>
      col.notNull().references('shops.id').onDelete('cascade'),
    )
    .addColumn('tenant_id', 'integer', (col) =>
      col.notNull().references('tenants.id').onDelete('cascade'),
    )
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('marketplaces_code_shop_id_key', ['code', 'shop_id'])
    .execute();

  await db.schema.createIndex('idx_marketplaces_shop_id').on('marketplaces').column('shop_id').execute();
  await db.schema.createIndex('idx_marketplaces_tenant_id').on('marketplaces').column('tenant_id').execute();
  await db.schema.createIndex('idx_marketplaces_title').on('marketplaces').column('title').execute();

  // ── Brands ──
  await db.schema
    .createTable('brands')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('code', 'varchar(255)', (col) => col.notNull())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('shop_id', 'integer', (col) =>
      col.notNull().references('shops.id').onDelete('cascade'),
    )
    .addColumn('tenant_id', 'integer', (col) =>
      col.notNull().references('tenants.id').onDelete('cascade'),
    )
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('brands_code_shop_id_key', ['code', 'shop_id'])
    .execute();

  await db.schema.createIndex('idx_brands_shop_id').on('brands').column('shop_id').execute();
  await db.schema.createIndex('idx_brands_tenant_id').on('brands').column('tenant_id').execute();
  await db.schema.createIndex('idx_brands_title').on('brands').column('title').execute();

  // ── Categories ──
  await db.schema
    .createTable('categories')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('tenant_id', 'integer', (col) =>
      col.notNull().references('tenants.id').onDelete('cascade'),
    )
    .addColumn('shop_id', 'integer', (col) =>
      col.notNull().references('shops.id').onDelete('cascade'),
    )
    .addColumn('code', 'varchar(100)', (col) => col.notNull())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('categories_shop_id_code_key', ['shop_id', 'code'])
    .execute();

  await db.schema.createIndex('idx_categories_shop_id').on('categories').column('shop_id').execute();
  await db.schema.createIndex('idx_categories_tenant_id').on('categories').column('tenant_id').execute();

  // ── Groups ──
  await db.schema
    .createTable('groups')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('tenant_id', 'integer', (col) =>
      col.notNull().references('tenants.id').onDelete('cascade'),
    )
    .addColumn('shop_id', 'integer', (col) =>
      col.notNull().references('shops.id').onDelete('cascade'),
    )
    .addColumn('code', 'varchar(100)', (col) => col.notNull())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('groups_shop_id_code_key', ['shop_id', 'code'])
    .execute();

  await db.schema.createIndex('idx_groups_shop_id').on('groups').column('shop_id').execute();
  await db.schema.createIndex('idx_groups_tenant_id').on('groups').column('tenant_id').execute();

  // ── Statuses ──
  await db.schema
    .createTable('statuses')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('tenant_id', 'integer', (col) =>
      col.notNull().references('tenants.id').onDelete('cascade'),
    )
    .addColumn('shop_id', 'integer', (col) =>
      col.notNull().references('shops.id').onDelete('cascade'),
    )
    .addColumn('code', 'varchar(100)', (col) => col.notNull())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('statuses_shop_id_code_key', ['shop_id', 'code'])
    .execute();

  await db.schema.createIndex('idx_statuses_shop_id').on('statuses').column('shop_id').execute();
  await db.schema.createIndex('idx_statuses_tenant_id').on('statuses').column('tenant_id').execute();

  // ── Suppliers ──
  await db.schema
    .createTable('suppliers')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('tenant_id', 'integer', (col) =>
      col.notNull().references('tenants.id').onDelete('cascade'),
    )
    .addColumn('shop_id', 'integer', (col) =>
      col.notNull().references('shops.id').onDelete('cascade'),
    )
    .addColumn('code', 'varchar(100)', (col) => col.notNull())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('suppliers_shop_id_code_key', ['shop_id', 'code'])
    .execute();

  await db.schema.createIndex('idx_suppliers_shop_id').on('suppliers').column('shop_id').execute();
  await db.schema.createIndex('idx_suppliers_tenant_id').on('suppliers').column('tenant_id').execute();

  // ── SKUs ──
  await db.schema
    .createTable('skus')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('code', 'varchar(255)', (col) => col.notNull())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('title2', 'varchar(255)')
    .addColumn('category_id', 'integer', (col) =>
      col.references('categories.id').onDelete('set null'),
    )
    .addColumn('group_id', 'integer', (col) => col.references('groups.id').onDelete('set null'))
    .addColumn('status_id', 'integer', (col) =>
      col.references('statuses.id').onDelete('set null'),
    )
    .addColumn('supplier_id', 'integer', (col) =>
      col.references('suppliers.id').onDelete('set null'),
    )
    .addColumn('shop_id', 'integer', (col) =>
      col.notNull().references('shops.id').onDelete('cascade'),
    )
    .addColumn('tenant_id', 'integer', (col) =>
      col.notNull().references('tenants.id').onDelete('cascade'),
    )
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('skus_code_shop_id_key', ['code', 'shop_id'])
    .execute();

  await db.schema.createIndex('idx_skus_shop_id').on('skus').column('shop_id').execute();
  await db.schema.createIndex('idx_skus_tenant_id').on('skus').column('tenant_id').execute();
  await db.schema.createIndex('idx_skus_title').on('skus').column('title').execute();
  await db.schema.createIndex('idx_skus_category_id').on('skus').column('category_id').execute();
  await db.schema.createIndex('idx_skus_group_id').on('skus').column('group_id').execute();
  await db.schema.createIndex('idx_skus_status_id').on('skus').column('status_id').execute();
  await db.schema.createIndex('idx_skus_supplier_id').on('skus').column('supplier_id').execute();

  // ── Warehouses ──
  await db.schema
    .createTable('warehouses')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('tenant_id', 'integer', (col) =>
      col.notNull().references('tenants.id').onDelete('cascade'),
    )
    .addColumn('shop_id', 'integer', (col) =>
      col.notNull().references('shops.id').onDelete('cascade'),
    )
    .addColumn('code', 'varchar(100)', (col) => col.notNull())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('warehouses_shop_id_code_key', ['shop_id', 'code'])
    .execute();

  await db.schema.createIndex('idx_warehouses_shop_id').on('warehouses').column('shop_id').execute();
  await db.schema.createIndex('idx_warehouses_tenant_id').on('warehouses').column('tenant_id').execute();

  // ── Sales History ──
  await sql`
    CREATE TABLE sales_history (
      id SERIAL PRIMARY KEY,
      shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      sku_id INTEGER NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
      marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE RESTRICT,
      period DATE NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT sales_history_period_first_of_month CHECK (EXTRACT(DAY FROM period) = 1),
      UNIQUE (shop_id, sku_id, period, marketplace_id)
    )
  `.execute(db);

  await db.schema.createIndex('idx_sales_history_shop_id').on('sales_history').column('shop_id').execute();
  await db.schema.createIndex('idx_sales_history_tenant_id').on('sales_history').column('tenant_id').execute();
  await db.schema.createIndex('idx_sales_history_sku_id').on('sales_history').column('sku_id').execute();
  await db.schema.createIndex('idx_sales_history_marketplace_id').on('sales_history').column('marketplace_id').execute();
  await db.schema.createIndex('idx_sales_history_period').on('sales_history').column('period').execute();

  // ── Leftovers ──
  await sql`
    CREATE TABLE leftovers (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
      warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
      sku_id INTEGER NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
      period DATE NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT leftovers_period_first_of_month CHECK (EXTRACT(DAY FROM period) = 1),
      UNIQUE(shop_id, warehouse_id, sku_id, period)
    )
  `.execute(db);

  await db.schema.createIndex('idx_leftovers_shop_id').on('leftovers').column('shop_id').execute();
  await db.schema.createIndex('idx_leftovers_tenant_id').on('leftovers').column('tenant_id').execute();
  await db.schema.createIndex('idx_leftovers_warehouse_id').on('leftovers').column('warehouse_id').execute();
  await db.schema.createIndex('idx_leftovers_sku_id').on('leftovers').column('sku_id').execute();
  await db.schema.createIndex('idx_leftovers_period').on('leftovers').column('period').execute();

  // ── Seasonal Coefficients ──
  await sql`
    CREATE TABLE seasonal_coefficients (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
      coefficient DOUBLE PRECISION NOT NULL DEFAULT 1.0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(shop_id, group_id, month)
    )
  `.execute(db);

  await db.schema.createIndex('idx_seasonal_coefficients_shop_id').on('seasonal_coefficients').column('shop_id').execute();
  await db.schema.createIndex('idx_seasonal_coefficients_tenant_id').on('seasonal_coefficients').column('tenant_id').execute();
  await db.schema.createIndex('idx_seasonal_coefficients_group_id').on('seasonal_coefficients').column('group_id').execute();

  // ── Competitor Products ──
  await sql`
    CREATE TABLE competitor_products (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
      marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
      marketplace_product_id BIGINT NOT NULL,
      title VARCHAR(1000),
      brand VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(shop_id, marketplace_id, marketplace_product_id)
    )
  `.execute(db);

  await db.schema.createIndex('idx_competitor_products_shop_id').on('competitor_products').column('shop_id').execute();
  await db.schema.createIndex('idx_competitor_products_tenant_id').on('competitor_products').column('tenant_id').execute();
  await db.schema.createIndex('idx_competitor_products_marketplace_id').on('competitor_products').column('marketplace_id').execute();
  await db.schema.createIndex('idx_competitor_products_marketplace_product_id').on('competitor_products').column('marketplace_product_id').execute();

  // ── SKU Competitor Mappings ──
  await db.schema
    .createTable('sku_competitor_mappings')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('tenant_id', 'integer', (col) =>
      col.notNull().references('tenants.id').onDelete('cascade'),
    )
    .addColumn('shop_id', 'integer', (col) =>
      col.notNull().references('shops.id').onDelete('cascade'),
    )
    .addColumn('sku_id', 'integer', (col) =>
      col.notNull().references('skus.id').onDelete('cascade'),
    )
    .addColumn('competitor_product_id', 'integer', (col) =>
      col.notNull().references('competitor_products.id').onDelete('cascade'),
    )
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('sku_competitor_mappings_shop_sku_competitor_product_key', [
      'shop_id',
      'sku_id',
      'competitor_product_id',
    ])
    .execute();

  await db.schema.createIndex('idx_sku_competitor_mappings_shop_id').on('sku_competitor_mappings').column('shop_id').execute();
  await db.schema.createIndex('idx_sku_competitor_mappings_tenant_id').on('sku_competitor_mappings').column('tenant_id').execute();
  await db.schema.createIndex('idx_sku_competitor_mappings_sku_id').on('sku_competitor_mappings').column('sku_id').execute();
  await db.schema.createIndex('idx_sku_competitor_mappings_competitor_product_id').on('sku_competitor_mappings').column('competitor_product_id').execute();

  // ── Competitor Sales ──
  await sql`
    CREATE TABLE competitor_sales (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
      competitor_product_id INTEGER NOT NULL REFERENCES competitor_products(id) ON DELETE CASCADE,
      period DATE NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT competitor_sales_period_first_of_month CHECK (EXTRACT(DAY FROM period) = 1),
      UNIQUE(shop_id, competitor_product_id, period)
    )
  `.execute(db);

  await db.schema.createIndex('idx_competitor_sales_shop_id').on('competitor_sales').column('shop_id').execute();
  await db.schema.createIndex('idx_competitor_sales_tenant_id').on('competitor_sales').column('tenant_id').execute();
  await db.schema.createIndex('idx_competitor_sales_competitor_product_id').on('competitor_sales').column('competitor_product_id').execute();
  await db.schema.createIndex('idx_competitor_sales_period').on('competitor_sales').column('period').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('competitor_sales').ifExists().cascade().execute();
  await db.schema.dropTable('sku_competitor_mappings').ifExists().cascade().execute();
  await db.schema.dropTable('competitor_products').ifExists().cascade().execute();
  await db.schema.dropTable('seasonal_coefficients').ifExists().cascade().execute();
  await db.schema.dropTable('leftovers').ifExists().cascade().execute();
  await db.schema.dropTable('sales_history').ifExists().cascade().execute();
  await db.schema.dropTable('skus').ifExists().cascade().execute();
  await db.schema.dropTable('warehouses').ifExists().cascade().execute();
  await db.schema.dropTable('suppliers').ifExists().cascade().execute();
  await db.schema.dropTable('statuses').ifExists().cascade().execute();
  await db.schema.dropTable('groups').ifExists().cascade().execute();
  await db.schema.dropTable('categories').ifExists().cascade().execute();
  await db.schema.dropTable('brands').ifExists().cascade().execute();
  await db.schema.dropTable('marketplaces').ifExists().cascade().execute();
  await db.schema.dropTable('user_shops').ifExists().cascade().execute();
  await db.schema.dropTable('user_roles').ifExists().cascade().execute();
  await db.schema.dropTable('api_keys').ifExists().cascade().execute();
  await db.schema.dropTable('shops').ifExists().cascade().execute();
  await db.schema.dropTable('tenants').ifExists().cascade().execute();
  await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_default_shop_id_fkey`.execute(db);
  await db.schema.dropTable('roles').ifExists().cascade().execute();
  await db.schema.dropTable('users').ifExists().cascade().execute();
}
