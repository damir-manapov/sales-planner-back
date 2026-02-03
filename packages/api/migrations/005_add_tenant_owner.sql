-- Add owner_id to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id);
