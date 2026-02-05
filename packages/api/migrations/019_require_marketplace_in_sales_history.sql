-- Marketplace is now required in sales_history

-- Ensure UNKNOWN marketplace exists for ALL shops
-- Since marketplaces now have composite primary key (code, shop_id), we need to create UNKNOWN for each shop
INSERT INTO marketplaces (code, title, shop_id, tenant_id, updated_at)
SELECT 'UNKNOWN', 'Unknown', s.id, s.tenant_id, NOW()
FROM shops s
ON CONFLICT (code, shop_id) DO NOTHING;

-- Make marketplace_id NOT NULL (any existing NULL values should be updated first)
-- If there are NULL values, set them to a default marketplace
UPDATE sales_history SET marketplace_id = 'UNKNOWN' WHERE marketplace_id IS NULL;

-- Make the column NOT NULL
ALTER TABLE sales_history ALTER COLUMN marketplace_id SET NOT NULL;

-- Drop partial unique indexes as they're no longer needed
DROP INDEX IF EXISTS idx_sales_history_unique_no_marketplace;
DROP INDEX IF EXISTS idx_sales_history_unique_with_marketplace;

-- Create regular unique constraint on all 4 columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_history_shop_id_sku_id_period_marketplace_id_key') THEN
    ALTER TABLE sales_history
    ADD CONSTRAINT sales_history_shop_id_sku_id_period_marketplace_id_key 
    UNIQUE (shop_id, sku_id, period, marketplace_id);
  END IF;
END $$;
