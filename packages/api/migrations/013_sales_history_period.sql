-- Migrate sales_history from year/month columns to single period DATE column

-- Add new period column
ALTER TABLE sales_history ADD COLUMN IF NOT EXISTS period DATE;

-- Migrate existing data: convert year/month to first day of month (only if columns exist)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_history' AND column_name = 'year') THEN
    UPDATE sales_history SET period = make_date(year, month, 1) WHERE period IS NULL;
  END IF;
END $$;

-- Make period NOT NULL after migration
ALTER TABLE sales_history ALTER COLUMN period SET NOT NULL;

-- Add constraint to ensure period is always first of month
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_history_period_first_of_month') THEN
    ALTER TABLE sales_history ADD CONSTRAINT sales_history_period_first_of_month
      CHECK (EXTRACT(DAY FROM period) = 1);
  END IF;
END $$;

-- Drop old unique constraint
ALTER TABLE sales_history DROP CONSTRAINT IF EXISTS sales_history_shop_id_sku_id_year_month_key;

-- Add new unique constraint with period
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_history_shop_sku_period_unique') THEN
    ALTER TABLE sales_history ADD CONSTRAINT sales_history_shop_sku_period_unique
      UNIQUE (shop_id, sku_id, period);
  END IF;
END $$;

-- Drop old indexes on year/month
DROP INDEX IF EXISTS idx_sales_history_year_month;

-- Add new index on period
CREATE INDEX IF NOT EXISTS idx_sales_history_period ON sales_history(period);

-- Drop old columns if they exist
ALTER TABLE sales_history DROP COLUMN IF EXISTS year;
ALTER TABLE sales_history DROP COLUMN IF EXISTS month;
