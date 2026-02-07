/**
 * SKU Metrics - Computed entity from materialized view
 *
 * This is a read-only computed entity providing aggregated metrics for SKUs
 * including sales, stock levels, and ABC classification.
 */

export interface SkuMetrics {
  id: number;
  sku_id: number;
  shop_id: number;
  tenant_id: number;
  sku_code: string;
  sku_title: string;
  /** Group ID (null if not assigned) */
  group_id: number | null;
  /** Category ID (null if not assigned) */
  category_id: number | null;
  /** Brand ID (null if not assigned) */
  brand_id: number | null;
  /** Status ID (null if not assigned) */
  status_id: number | null;
  /** Supplier ID (null if not assigned) */
  supplier_id: number | null;
  /** Group code (for export convenience) */
  group_code: string | null;
  /** Category code (for export convenience) */
  category_code: string | null;
  /** Brand code (for export convenience) */
  brand_code: string | null;
  /** Status code (for export convenience) */
  status_code: string | null;
  /** Supplier code (for export convenience) */
  supplier_code: string | null;
  /** Period in YYYY-MM format */
  last_period: string;
  /** Total sales quantity for the last period */
  last_period_sales: number;
  /** Current stock across all warehouses */
  current_stock: number;
  /** Estimated days of stock based on sales velocity */
  days_of_stock: number | null;
  /** ABC classification: A (top 20%), B (next 30%), C (bottom 50%) */
  abc_class: 'A' | 'B' | 'C';
  /** Sales rank within the shop (1 = highest sales) */
  sales_rank: number;
  /** When this metric was last computed */
  computed_at: Date;
}

/**
 * SKU Metrics export item - uses codes instead of IDs
 * Follows same naming pattern as SkuExportItem (simple field names)
 */
export interface SkuMetricsExportItem {
  code: string;
  title: string;
  group: string | null;
  category: string | null;
  brand: string | null;
  status: string | null;
  supplier: string | null;
  lastPeriod: string;
  lastPeriodSales: number;
  currentStock: number;
  daysOfStock: number | null;
  abcClass: 'A' | 'B' | 'C';
  salesRank: number;
}
