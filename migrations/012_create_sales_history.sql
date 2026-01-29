-- Sales history table (monthly aggregates per SKU per shop)
CREATE TABLE IF NOT EXISTS sales_history (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku_id INTEGER NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  quantity INTEGER NOT NULL DEFAULT 0,
  amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shop_id, sku_id, year, month)
);

CREATE INDEX idx_sales_history_shop_id ON sales_history(shop_id);
CREATE INDEX idx_sales_history_tenant_id ON sales_history(tenant_id);
CREATE INDEX idx_sales_history_sku_id ON sales_history(sku_id);
CREATE INDEX idx_sales_history_year_month ON sales_history(year, month);
