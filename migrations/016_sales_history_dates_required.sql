-- Migration: Make sales_history created_at and updated_at required
-- Set default timestamps for existing NULL values, then make columns NOT NULL

UPDATE sales_history SET created_at = NOW() WHERE created_at IS NULL;
UPDATE sales_history SET updated_at = NOW() WHERE updated_at IS NULL;

ALTER TABLE sales_history ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE sales_history ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE sales_history ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE sales_history ALTER COLUMN updated_at SET DEFAULT NOW();
