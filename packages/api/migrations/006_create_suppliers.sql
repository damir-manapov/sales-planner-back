-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, code)
);

-- Create index on shop_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_suppliers_shop_id ON suppliers(shop_id);

-- Create index on tenant_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);
