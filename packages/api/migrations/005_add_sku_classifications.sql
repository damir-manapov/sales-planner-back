-- Add category, group, and status references to SKUs
ALTER TABLE skus 
  ADD COLUMN IF NOT EXISTS category_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS group_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS status_code VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_skus_category_code ON skus(category_code);
CREATE INDEX IF NOT EXISTS idx_skus_group_code ON skus(group_code);
CREATE INDEX IF NOT EXISTS idx_skus_status_code ON skus(status_code);
