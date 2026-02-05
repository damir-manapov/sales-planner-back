-- Add shop_id and tenant_id to marketplaces table to scope them to shops

-- First, drop the foreign key from sales_history to marketplaces
-- This is needed because we're changing the primary key structure
ALTER TABLE sales_history DROP CONSTRAINT IF EXISTS sales_history_marketplace_id_fkey;

-- Drop the old primary key
ALTER TABLE marketplaces DROP CONSTRAINT IF EXISTS marketplaces_pkey CASCADE;

-- Add the columns as nullable
ALTER TABLE marketplaces ADD COLUMN IF NOT EXISTS shop_id INTEGER;
ALTER TABLE marketplaces ADD COLUMN IF NOT EXISTS tenant_id INTEGER;

-- Create marketplace records for all (marketplace_id, shop_id) combinations in sales_history
INSERT INTO marketplaces (code, title, shop_id, tenant_id, created_at, updated_at)
SELECT DISTINCT 
  sh.marketplace_id,
  sh.marketplace_id as title,
  sh.shop_id,
  s.tenant_id,
  NOW(),
  NOW()
FROM sales_history sh
JOIN shops s ON sh.shop_id = s.id
WHERE sh.marketplace_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- For any existing marketplaces not yet assigned, assign to first shop
DO $$
DECLARE
  first_shop_id INTEGER;
  first_tenant_id INTEGER;
BEGIN
  SELECT id, tenant_id INTO first_shop_id, first_tenant_id
  FROM shops
  ORDER BY id
  LIMIT 1;

  IF first_shop_id IS NOT NULL THEN
    UPDATE marketplaces
    SET shop_id = first_shop_id, tenant_id = first_tenant_id
    WHERE shop_id IS NULL;
  ELSE
    -- No shops exist, delete orphaned marketplaces
    DELETE FROM marketplaces WHERE shop_id IS NULL;
  END IF;
END $$;

-- Now make the columns NOT NULL
ALTER TABLE marketplaces ALTER COLUMN shop_id SET NOT NULL;
ALTER TABLE marketplaces ALTER COLUMN tenant_id SET NOT NULL;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketplaces_shop_id_fkey') THEN
    ALTER TABLE marketplaces ADD CONSTRAINT marketplaces_shop_id_fkey
      FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketplaces_tenant_id_fkey') THEN
    ALTER TABLE marketplaces ADD CONSTRAINT marketplaces_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add new composite primary key (code per shop)
-- First, remove any duplicate (code, shop_id) pairs keeping the first one
DELETE FROM marketplaces a USING marketplaces b
WHERE a.ctid < b.ctid
  AND a.code = b.code
  AND a.shop_id = b.shop_id;

ALTER TABLE marketplaces ADD PRIMARY KEY (code, shop_id);

-- Add indexes for lookups
CREATE INDEX IF NOT EXISTS idx_marketplaces_shop_id ON marketplaces(shop_id);
CREATE INDEX IF NOT EXISTS idx_marketplaces_tenant_id ON marketplaces(tenant_id);

-- Recreate the foreign key from sales_history to marketplaces
-- Note: This now references the composite key (code, shop_id)
ALTER TABLE sales_history ADD CONSTRAINT sales_history_marketplace_id_fkey
  FOREIGN KEY (marketplace_id, shop_id) REFERENCES marketplaces(code, shop_id) ON DELETE SET NULL;
