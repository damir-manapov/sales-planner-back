-- Add marketplace_id column to sales_history table
ALTER TABLE sales_history
ADD COLUMN IF NOT EXISTS marketplace_id VARCHAR(255) REFERENCES marketplaces(id) ON DELETE SET NULL;

-- Create index for marketplace_id
CREATE INDEX IF NOT EXISTS idx_sales_history_marketplace_id ON sales_history(marketplace_id);

-- Create partial unique index for records WITHOUT marketplace
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_history_unique_no_marketplace 
  ON sales_history(shop_id, sku_id, period) WHERE marketplace_id IS NULL;

-- Create partial unique index for records WITH marketplace  
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_history_unique_with_marketplace 
  ON sales_history(shop_id, sku_id, period, marketplace_id) WHERE marketplace_id IS NOT NULL;

-- Drop old constraint if exists (may not exist on fresh databases)
ALTER TABLE sales_history DROP CONSTRAINT IF EXISTS sales_history_shop_id_sku_id_period_key;
