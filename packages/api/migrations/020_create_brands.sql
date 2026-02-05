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

-- Index for shop lookups
CREATE INDEX IF NOT EXISTS idx_brands_shop_id ON brands(shop_id);

-- Index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_brands_tenant_id ON brands(tenant_id);
