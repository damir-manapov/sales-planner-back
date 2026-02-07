-- Leftovers (inventory) table
-- Tracks stock levels per SKU per warehouse per period
CREATE TABLE IF NOT EXISTS leftovers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    sku_id INTEGER NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
    period DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT leftovers_period_first_of_month CHECK (EXTRACT(DAY FROM period) = 1),
    UNIQUE(shop_id, warehouse_id, sku_id, period)
);

CREATE INDEX IF NOT EXISTS idx_leftovers_shop_id ON leftovers(shop_id);
CREATE INDEX IF NOT EXISTS idx_leftovers_tenant_id ON leftovers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leftovers_warehouse_id ON leftovers(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_leftovers_sku_id ON leftovers(sku_id);
CREATE INDEX IF NOT EXISTS idx_leftovers_period ON leftovers(period);
