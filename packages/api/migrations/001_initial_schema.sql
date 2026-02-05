-- Initial database schema for Sales Planner

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  default_shop_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create shops table
CREATE TABLE IF NOT EXISTS shops (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, title)
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('systemAdmin', 'System administrator with full access'),
  ('tenantOwner', 'Tenant owner with full access to tenant resources'),
  ('tenantAdmin', 'Tenant administrator with management access'),
  ('tenantEditor', 'Tenant editor with write access'),
  ('tenantViewer', 'Tenant viewer with read-only access')
ON CONFLICT (name) DO NOTHING;

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role_id, tenant_id, shop_id)
);

-- Create user_shops table (default shop for user)
CREATE TABLE IF NOT EXISTS user_shops (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add foreign key from users to shops for default_shop_id
ALTER TABLE users ADD CONSTRAINT users_default_shop_id_fkey
  FOREIGN KEY (default_shop_id) REFERENCES shops(id) ON DELETE SET NULL;

-- Create marketplaces table
CREATE TABLE IF NOT EXISTS marketplaces (
  id SERIAL PRIMARY KEY,
  code VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (code, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_marketplaces_shop_id ON marketplaces(shop_id);
CREATE INDEX IF NOT EXISTS idx_marketplaces_tenant_id ON marketplaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_marketplaces_title ON marketplaces(title);

-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  code VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (code, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_brands_shop_id ON brands(shop_id);
CREATE INDEX IF NOT EXISTS idx_brands_tenant_id ON brands(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brands_title ON brands(title);

-- Create skus table
CREATE TABLE IF NOT EXISTS skus (
  id SERIAL PRIMARY KEY,
  code VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (code, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_skus_shop_id ON skus(shop_id);
CREATE INDEX IF NOT EXISTS idx_skus_tenant_id ON skus(tenant_id);
CREATE INDEX IF NOT EXISTS idx_skus_title ON skus(title);
CREATE INDEX IF NOT EXISTS idx_skus_brand_id ON skus(brand_id);

-- Create sales_history table
CREATE TABLE IF NOT EXISTS sales_history (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku_id INTEGER NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
  marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE RESTRICT,
  period DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT sales_history_period_first_of_month CHECK (EXTRACT(DAY FROM period) = 1),
  UNIQUE (shop_id, sku_id, period, marketplace_id)
);

CREATE INDEX IF NOT EXISTS idx_sales_history_shop_id ON sales_history(shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_history_tenant_id ON sales_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_history_sku_id ON sales_history(sku_id);
CREATE INDEX IF NOT EXISTS idx_sales_history_marketplace_id ON sales_history(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_sales_history_period ON sales_history(period);

-- Create indexes for API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Create indexes for user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_shop_id ON user_roles(shop_id);
