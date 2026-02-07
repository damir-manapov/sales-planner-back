-- Update competitor_sales to use competitor_product_id FK
-- Step 1: Add competitor_product_id column
ALTER TABLE competitor_sales ADD COLUMN competitor_product_id INTEGER;

-- Step 2: Create competitor_products from existing competitor_sales data (if not exists)
INSERT INTO competitor_products (tenant_id, shop_id, marketplace_id, marketplace_product_id, updated_at)
SELECT DISTINCT tenant_id, shop_id, marketplace_id, competitor_sku_code::BIGINT, NOW()
FROM competitor_sales
ON CONFLICT (shop_id, marketplace_id, marketplace_product_id) DO NOTHING;

-- Step 3: Populate competitor_product_id from lookup
UPDATE competitor_sales cs
SET competitor_product_id = cp.id
FROM competitor_products cp
WHERE cs.shop_id = cp.shop_id
  AND cs.marketplace_id = cp.marketplace_id
  AND cs.competitor_sku_code::BIGINT = cp.marketplace_product_id;

-- Step 4: Make competitor_product_id NOT NULL and add FK
ALTER TABLE competitor_sales ALTER COLUMN competitor_product_id SET NOT NULL;
ALTER TABLE competitor_sales 
  ADD CONSTRAINT fk_competitor_sales_competitor_product 
  FOREIGN KEY (competitor_product_id) REFERENCES competitor_products(id) ON DELETE CASCADE;

-- Step 5: Drop old columns and indexes
DROP INDEX IF EXISTS idx_competitor_sales_marketplace_id;
DROP INDEX IF EXISTS idx_competitor_sales_competitor_sku_code;
ALTER TABLE competitor_sales DROP COLUMN marketplace_id;
ALTER TABLE competitor_sales DROP COLUMN competitor_sku_code;

-- Step 6: Update unique constraint
ALTER TABLE competitor_sales DROP CONSTRAINT IF EXISTS competitor_sales_shop_id_marketplace_id_competitor_sku_code_key;
ALTER TABLE competitor_sales ADD CONSTRAINT competitor_sales_shop_competitor_product_period_key 
  UNIQUE(shop_id, competitor_product_id, period);

-- Step 7: Add index on competitor_product_id
CREATE INDEX IF NOT EXISTS idx_competitor_sales_competitor_product_id ON competitor_sales(competitor_product_id);
