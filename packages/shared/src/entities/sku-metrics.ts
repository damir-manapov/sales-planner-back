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
  group_code: string | null;
  category_code: string | null;
  brand_code: string | null;
  status_code: string | null;
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
