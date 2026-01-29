-- Add shop_id column to user_roles table for shop-level role assignments
-- viewer and editor roles are assigned per shop, tenantAdmin is assigned per tenant

ALTER TABLE user_roles ADD COLUMN shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE;

-- Create index for faster lookups by shop
CREATE INDEX idx_user_roles_shop_id ON user_roles(shop_id);

-- Create composite index for user + shop lookups
CREATE INDEX idx_user_roles_user_shop ON user_roles(user_id, shop_id);
