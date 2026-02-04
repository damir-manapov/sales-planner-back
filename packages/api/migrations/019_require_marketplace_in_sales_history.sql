-- Marketplace is now required in sales_history

-- Ensure UNKNOWN marketplace exists FIRST
INSERT INTO marketplaces (id, title, updated_at)
VALUES ('UNKNOWN', 'Unknown', NOW())
ON CONFLICT (id) DO NOTHING;

-- Make marketplace_id NOT NULL (any existing NULL values should be updated first)
-- If there are NULL values, set them to a default marketplace
UPDATE sales_history SET marketplace_id = 'UNKNOWN' WHERE marketplace_id IS NULL;

-- Make the column NOT NULL
ALTER TABLE sales_history ALTER COLUMN marketplace_id SET NOT NULL;

-- Drop partial unique indexes as they're no longer needed
DROP INDEX IF EXISTS idx_sales_history_unique_no_marketplace;
DROP INDEX IF EXISTS idx_sales_history_unique_with_marketplace;

-- Create regular unique constraint on all 4 columns
ALTER TABLE sales_history
ADD CONSTRAINT sales_history_shop_id_sku_id_period_marketplace_id_key 
UNIQUE (shop_id, sku_id, period, marketplace_id);
