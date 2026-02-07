-- Fix column types in new tables
-- 1. Change coefficient from NUMERIC to DOUBLE PRECISION for JavaScript number compatibility
-- 2. Add NOT NULL constraints to created_at and updated_at columns

-- Fix seasonal_coefficients table
ALTER TABLE seasonal_coefficients
  ALTER COLUMN coefficient TYPE DOUBLE PRECISION,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Fix sku_competitor_mappings table
ALTER TABLE sku_competitor_mappings
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW();
