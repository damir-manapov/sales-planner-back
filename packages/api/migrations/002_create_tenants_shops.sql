-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_title ON tenants(title);

-- Create shops table (linked to tenant)
CREATE TABLE IF NOT EXISTS shops (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shops_tenant_id ON shops(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shops_title ON shops(title);

-- Create user_shops table (linking users to shops)
CREATE TABLE IF NOT EXISTS user_shops (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_user_shops_user_id ON user_shops(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shops_shop_id ON user_shops(shop_id);
