-- Competitor products table
-- Stores competitor product catalog with marketplace product IDs
CREATE TABLE IF NOT EXISTS competitor_products (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    marketplace_product_id BIGINT NOT NULL,
    title VARCHAR(1000),
    brand VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, marketplace_id, marketplace_product_id)
);

CREATE INDEX IF NOT EXISTS idx_competitor_products_shop_id ON competitor_products(shop_id);
CREATE INDEX IF NOT EXISTS idx_competitor_products_tenant_id ON competitor_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_competitor_products_marketplace_id ON competitor_products(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_competitor_products_marketplace_product_id ON competitor_products(marketplace_product_id);
