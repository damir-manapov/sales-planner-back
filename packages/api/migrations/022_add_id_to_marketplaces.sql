-- Add numeric id column to marketplaces table
-- Keep code as unique identifier per shop, add id as primary key

-- First, drop foreign keys that depend on the primary key
ALTER TABLE sales_history DROP CONSTRAINT IF EXISTS sales_history_marketplace_id_fkey;

-- Drop the existing primary key on code+shop_id
ALTER TABLE marketplaces DROP CONSTRAINT IF EXISTS marketplaces_pkey CASCADE;

-- Add id column as serial (auto-increment)
ALTER TABLE marketplaces ADD COLUMN id SERIAL;

-- Make id the primary key
ALTER TABLE marketplaces ADD PRIMARY KEY (id);

-- Ensure code+shop_id remains unique
ALTER TABLE marketplaces ADD CONSTRAINT marketplaces_code_shop_id_unique UNIQUE (code, shop_id);

-- Recreate the foreign key from sales_history
-- Now it will reference just the code (not the composite key)
-- We'll need to update this constraint later if needed
ALTER TABLE sales_history ADD CONSTRAINT sales_history_marketplace_id_fkey
  FOREIGN KEY (marketplace_id, shop_id) REFERENCES marketplaces(code, shop_id) ON DELETE SET NULL;
