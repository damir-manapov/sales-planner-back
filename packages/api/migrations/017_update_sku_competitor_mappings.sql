-- Update sku_competitor_mappings to use competitor_product_id FK
-- Step 1: Add competitor_product_id column
ALTER TABLE sku_competitor_mappings ADD COLUMN competitor_product_id INTEGER;

-- Step 2: Create competitor_products from existing sku_competitor_mappings data
INSERT INTO competitor_products (tenant_id, shop_id, marketplace_id, marketplace_product_id, updated_at)
SELECT DISTINCT tenant_id, shop_id, marketplace_id, competitor_sku_code::BIGINT, NOW()
FROM sku_competitor_mappings
ON CONFLICT (shop_id, marketplace_id, marketplace_product_id) DO NOTHING;

-- Step 3: Populate competitor_product_id from lookup
UPDATE sku_competitor_mappings scm
SET competitor_product_id = cp.id
FROM competitor_products cp
WHERE scm.shop_id = cp.shop_id
  AND scm.marketplace_id = cp.marketplace_id
  AND scm.competitor_sku_code::BIGINT = cp.marketplace_product_id;

-- Step 4: Make competitor_product_id NOT NULL and add FK
ALTER TABLE sku_competitor_mappings ALTER COLUMN competitor_product_id SET NOT NULL;
ALTER TABLE sku_competitor_mappings 
  ADD CONSTRAINT fk_sku_competitor_mappings_competitor_product 
  FOREIGN KEY (competitor_product_id) REFERENCES competitor_products(id) ON DELETE CASCADE;

-- Step 5: Drop old columns and indexes
DROP INDEX IF EXISTS idx_sku_competitor_mappings_marketplace_id;
DROP INDEX IF EXISTS idx_sku_competitor_mappings_competitor_sku_code;
ALTER TABLE sku_competitor_mappings DROP COLUMN marketplace_id;
ALTER TABLE sku_competitor_mappings DROP COLUMN competitor_sku_code;

-- Step 6: Update unique constraint
ALTER TABLE sku_competitor_mappings DROP CONSTRAINT IF EXISTS sku_competitor_mappings_shop_id_sku_id_marketplace_id_key;
ALTER TABLE sku_competitor_mappings ADD CONSTRAINT sku_competitor_mappings_shop_sku_competitor_product_key 
  UNIQUE(shop_id, sku_id, competitor_product_id);

-- Step 7: Add index on competitor_product_id
CREATE INDEX IF NOT EXISTS idx_sku_competitor_mappings_competitor_product_id ON sku_competitor_mappings(competitor_product_id);
