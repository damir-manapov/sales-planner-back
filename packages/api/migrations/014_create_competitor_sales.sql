-- Competitor sales table
-- Tracks sales of competitor products on marketplaces
CREATE TABLE IF NOT EXISTS competitor_sales (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    competitor_sku_code VARCHAR(255) NOT NULL, -- External competitor product ID
    period DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT competitor_sales_period_first_of_month CHECK (EXTRACT(DAY FROM period) = 1),
    UNIQUE(shop_id, marketplace_id, competitor_sku_code, period)
);

CREATE INDEX IF NOT EXISTS idx_competitor_sales_shop_id ON competitor_sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_competitor_sales_tenant_id ON competitor_sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_competitor_sales_marketplace_id ON competitor_sales(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_competitor_sales_competitor_sku_code ON competitor_sales(competitor_sku_code);
CREATE INDEX IF NOT EXISTS idx_competitor_sales_period ON competitor_sales(period);
