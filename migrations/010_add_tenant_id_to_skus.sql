-- Add tenant_id to skus table
ALTER TABLE skus ADD COLUMN tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE;

-- Update unique constraint to include tenant_id for clarity (optional, shop already implies tenant)
-- DROP CONSTRAINT skus_code_shop_id_key;
-- ALTER TABLE skus ADD CONSTRAINT skus_code_shop_id_key UNIQUE (code, shop_id);

-- Index for tenant lookups
CREATE INDEX idx_skus_tenant_id ON skus(tenant_id);
