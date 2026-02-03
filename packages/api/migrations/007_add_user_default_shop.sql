-- Add default_shop_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_shop_id INTEGER REFERENCES shops(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_default_shop_id ON users(default_shop_id);
