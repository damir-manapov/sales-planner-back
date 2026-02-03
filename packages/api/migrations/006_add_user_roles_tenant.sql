-- Add optional tenant_id to user_roles for tenant-scoped roles
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);

-- Update unique constraint to include tenant_id (user can have same role in different tenants)
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_id_key;
-- Use DO block to avoid error if constraint already exists
DO $$ BEGIN
  ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_role_id_tenant_id_key UNIQUE (user_id, role_id, tenant_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;
