-- Add created_by to tenants (required, references users)
-- First add as nullable
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE RESTRICT;

-- Set created_by to first user for existing tenants (or owner_id if available)
UPDATE tenants
SET created_by = COALESCE(owner_id, (SELECT id FROM users ORDER BY id LIMIT 1))
WHERE created_by IS NULL;

-- Now make it NOT NULL
ALTER TABLE tenants ALTER COLUMN created_by SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_created_by ON tenants(created_by);
