-- Fix competitor_products timestamps to be NOT NULL with defaults

-- Set defaults for existing NULL values
UPDATE competitor_products SET created_at = NOW() WHERE created_at IS NULL;
UPDATE competitor_products SET updated_at = NOW() WHERE updated_at IS NULL;

-- Add defaults and make NOT NULL
ALTER TABLE competitor_products
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;
