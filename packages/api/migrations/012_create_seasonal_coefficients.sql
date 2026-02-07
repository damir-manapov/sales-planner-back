-- Seasonal coefficients table
-- Tracks monthly demand coefficients per group for forecasting
CREATE TABLE IF NOT EXISTS seasonal_coefficients (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    coefficient NUMERIC(10, 4) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, group_id, month)
);

CREATE INDEX IF NOT EXISTS idx_seasonal_coefficients_shop_id ON seasonal_coefficients(shop_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_coefficients_tenant_id ON seasonal_coefficients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_coefficients_group_id ON seasonal_coefficients(group_id);
