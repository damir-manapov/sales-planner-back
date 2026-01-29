-- Create SKUs table
CREATE TABLE skus (
  id SERIAL PRIMARY KEY,
  code VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (code, shop_id)
);

-- Index for shop lookups
CREATE INDEX idx_skus_shop_id ON skus(shop_id);
