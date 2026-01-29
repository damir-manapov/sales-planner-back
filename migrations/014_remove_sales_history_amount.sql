-- Remove amount column from sales_history (only need quantity for item count)
ALTER TABLE sales_history DROP COLUMN amount;
