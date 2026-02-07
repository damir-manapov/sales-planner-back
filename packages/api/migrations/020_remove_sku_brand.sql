-- Remove brand_id from SKUs (was never used in the application)
-- Brands table remains for potential future use

-- Drop the index first
DROP INDEX IF EXISTS idx_skus_brand_id;

-- Remove the column
ALTER TABLE skus DROP COLUMN IF EXISTS brand_id;
