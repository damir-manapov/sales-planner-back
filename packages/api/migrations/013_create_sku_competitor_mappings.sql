-- SKU competitor mappings table
-- Maps our SKUs to competitor product IDs on marketplaces
CREATE TABLE IF NOT EXISTS sku_competitor_mappings (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    sku_id INTEGER NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    competitor_sku_code VARCHAR(255) NOT NULL, -- External competitor product ID on marketplace
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, sku_id, marketplace_id)
);

CREATE INDEX IF NOT EXISTS idx_sku_competitor_mappings_shop_id ON sku_competitor_mappings(shop_id);
CREATE INDEX IF NOT EXISTS idx_sku_competitor_mappings_tenant_id ON sku_competitor_mappings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sku_competitor_mappings_sku_id ON sku_competitor_mappings(sku_id);
CREATE INDEX IF NOT EXISTS idx_sku_competitor_mappings_marketplace_id ON sku_competitor_mappings(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_sku_competitor_mappings_competitor_sku_code ON sku_competitor_mappings(competitor_sku_code);
