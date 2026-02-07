-- Materialized view: SKU Metrics
-- Computes key metrics for each SKU based on last period sales and current inventory
--
-- Dependencies: skus, sales_history, leftovers, groups, categories, brands, statuses, suppliers
-- Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sku_metrics;

CREATE MATERIALIZED VIEW mv_sku_metrics AS
WITH last_period AS (
  -- Find the most recent period with sales data per shop
  SELECT shop_id, MAX(period) as period
  FROM sales_history
  GROUP BY shop_id
),
last_period_sales AS (
  -- Sum sales for the last period per SKU (across all marketplaces)
  SELECT
    sh.sku_id,
    sh.shop_id,
    TO_CHAR(sh.period, 'YYYY-MM') as last_period,
    SUM(sh.quantity) as last_period_sales
  FROM sales_history sh
  JOIN last_period lp ON sh.shop_id = lp.shop_id AND sh.period = lp.period
  GROUP BY sh.sku_id, sh.shop_id, sh.period
),
current_stock AS (
  -- Sum inventory across all warehouses for the latest period per SKU
  SELECT
    l.sku_id,
    l.shop_id,
    TO_CHAR(MAX(l.period), 'YYYY-MM') as stock_period,
    SUM(l.quantity) as current_stock
  FROM leftovers l
  JOIN (
    SELECT sku_id, shop_id, MAX(period) as max_period
    FROM leftovers
    GROUP BY sku_id, shop_id
  ) latest ON l.sku_id = latest.sku_id 
          AND l.shop_id = latest.shop_id 
          AND l.period = latest.max_period
  GROUP BY l.sku_id, l.shop_id
),
ranked_sales AS (
  -- Rank SKUs by sales within each shop
  SELECT
    sku_id,
    shop_id,
    last_period_sales,
    ROW_NUMBER() OVER (PARTITION BY shop_id ORDER BY last_period_sales DESC) as sales_rank,
    COUNT(*) OVER (PARTITION BY shop_id) as total_skus
  FROM last_period_sales
)
SELECT
  ROW_NUMBER() OVER () as id,
  s.id as sku_id,
  s.shop_id,
  s.tenant_id,
  s.code as sku_code,
  s.title as sku_title,
  -- IDs for API responses
  s.group_id,
  s.category_id,
  s.brand_id,
  s.status_id,
  s.supplier_id,
  -- Codes for export (denormalized for convenience)
  g.code as group_code,
  c.code as category_code,
  b.code as brand_code,
  st.code as status_code,
  su.code as supplier_code,
  COALESCE(lps.last_period, '') as last_period,
  COALESCE(lps.last_period_sales, 0)::integer as last_period_sales,
  COALESCE(cs.current_stock, 0)::integer as current_stock,
  CASE 
    WHEN COALESCE(lps.last_period_sales, 0) > 0 
    THEN ROUND((COALESCE(cs.current_stock, 0)::numeric / lps.last_period_sales) * 30, 1)
    ELSE NULL
  END as days_of_stock,
  CASE
    WHEN rs.sales_rank IS NULL THEN 'C'
    WHEN rs.sales_rank <= rs.total_skus * 0.2 THEN 'A'  -- Top 20%
    WHEN rs.sales_rank <= rs.total_skus * 0.5 THEN 'B'  -- Next 30%
    ELSE 'C'                                             -- Bottom 50%
  END as abc_class,
  COALESCE(rs.sales_rank, 999999)::integer as sales_rank,
  NOW() as computed_at
FROM skus s
LEFT JOIN groups g ON s.group_id = g.id
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN brands b ON s.brand_id = b.id
LEFT JOIN statuses st ON s.status_id = st.id
LEFT JOIN suppliers su ON s.supplier_id = su.id
LEFT JOIN last_period_sales lps ON s.id = lps.sku_id AND s.shop_id = lps.shop_id
LEFT JOIN current_stock cs ON s.id = cs.sku_id AND s.shop_id = cs.shop_id
LEFT JOIN ranked_sales rs ON s.id = rs.sku_id AND s.shop_id = rs.shop_id;

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX mv_sku_metrics_id_idx ON mv_sku_metrics (id);

-- Indexes for common queries
CREATE INDEX mv_sku_metrics_shop_id_idx ON mv_sku_metrics (shop_id);
CREATE INDEX mv_sku_metrics_tenant_id_idx ON mv_sku_metrics (tenant_id);
CREATE INDEX mv_sku_metrics_sku_id_idx ON mv_sku_metrics (sku_id);
CREATE INDEX mv_sku_metrics_abc_class_idx ON mv_sku_metrics (shop_id, abc_class);
