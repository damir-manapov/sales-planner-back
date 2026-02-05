/**
 * Base interface for entities scoped to both shop and tenant
 * (e.g., SKUs, Brands, Marketplaces)
 */
export interface ShopScopedEntity {
  id: number;
  code: string;
  title: string;
  shop_id: number;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}
