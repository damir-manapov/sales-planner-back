-- Add supplier_code to skus table
ALTER TABLE skus ADD COLUMN IF NOT EXISTS supplier_code VARCHAR(100);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_skus_supplier_code ON skus(supplier_code);
