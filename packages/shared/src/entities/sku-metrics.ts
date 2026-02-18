/**
 * SKU Metrics - Computed entity from materialized view
 *
 * This is a read-only computed entity providing aggregated metrics for SKUs
 * including sales, stock levels, and ABC classification.
 */

export interface SkuMetrics {
  id: number;
  skuId: number;
  shopId: number;
  tenantId: number;
  skuCode: string;
  skuTitle: string;
  /** Group ID (null if not assigned) */
  groupId: number | null;
  /** Category ID (null if not assigned) */
  categoryId: number | null;
  /** Status ID (null if not assigned) */
  statusId: number | null;
  /** Supplier ID (null if not assigned) */
  supplierId: number | null;
  /** Group code (for export convenience) */
  groupCode: string | null;
  /** Category code (for export convenience) */
  categoryCode: string | null;
  /** Status code (for export convenience) */
  statusCode: string | null;
  /** Supplier code (for export convenience) */
  supplierCode: string | null;
  /** Period in YYYY-MM format */
  lastPeriod: string;
  /** Total sales quantity for the last period */
  lastPeriodSales: number;
  /** Current stock across all warehouses */
  currentStock: number;
  /** Estimated days of stock based on sales velocity */
  daysOfStock: number | null;
  /** ABC classification: A (top 20%), B (next 30%), C (bottom 50%) */
  abcClass: 'A' | 'B' | 'C';
  /** Sales rank within the shop (1 = highest sales) */
  salesRank: number;
  /** When this metric was last computed */
  computedAt: Date;
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
  status: string | null;
  supplier: string | null;
  lastPeriod: string;
  lastPeriodSales: number;
  currentStock: number;
  daysOfStock: number | null;
  abcClass: 'A' | 'B' | 'C';
  salesRank: number;
}
