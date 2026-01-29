-- Migrate sales_history from year/month columns to single period DATE column

-- Add new period column
ALTER TABLE sales_history ADD COLUMN period DATE;

-- Migrate existing data: convert year/month to first day of month
UPDATE sales_history 
SET period = make_date(year, month, 1);

-- Make period NOT NULL after migration
ALTER TABLE sales_history ALTER COLUMN period SET NOT NULL;

-- Add constraint to ensure period is always first of month
ALTER TABLE sales_history ADD CONSTRAINT sales_history_period_first_of_month 
  CHECK (EXTRACT(DAY FROM period) = 1);

-- Drop old unique constraint
ALTER TABLE sales_history DROP CONSTRAINT IF EXISTS sales_history_shop_id_sku_id_year_month_key;

-- Add new unique constraint with period
ALTER TABLE sales_history ADD CONSTRAINT sales_history_shop_sku_period_unique 
  UNIQUE (shop_id, sku_id, period);

-- Drop old indexes on year/month
DROP INDEX IF EXISTS idx_sales_history_year_month;

-- Add new index on period
CREATE INDEX idx_sales_history_period ON sales_history(period);

-- Drop old columns
ALTER TABLE sales_history DROP COLUMN year;
ALTER TABLE sales_history DROP COLUMN month;
