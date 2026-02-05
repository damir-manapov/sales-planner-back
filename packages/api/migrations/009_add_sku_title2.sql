-- Add title2 column to skus table for alternative title (e.g., from external CSV imports)
ALTER TABLE skus ADD COLUMN IF NOT EXISTS title2 VARCHAR(255);
