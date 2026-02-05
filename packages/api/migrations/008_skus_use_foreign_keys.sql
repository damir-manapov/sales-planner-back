-- Convert SKUs from storing codes to storing foreign key IDs (following sales_history pattern)

-- Drop old code columns
ALTER TABLE skus DROP COLUMN IF EXISTS category_code;
ALTER TABLE skus DROP COLUMN IF EXISTS group_code;
ALTER TABLE skus DROP COLUMN IF EXISTS status_code;
ALTER TABLE skus DROP COLUMN IF EXISTS supplier_code;

-- Add foreign key ID columns
ALTER TABLE skus
  ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status_id INTEGER REFERENCES statuses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL;

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_skus_category_id ON skus(category_id);
CREATE INDEX IF NOT EXISTS idx_skus_group_id ON skus(group_id);
CREATE INDEX IF NOT EXISTS idx_skus_status_id ON skus(status_id);
CREATE INDEX IF NOT EXISTS idx_skus_supplier_id ON skus(supplier_id);
