/**
 * Base interface for entities scoped to both shop and tenant
 * without code/title (e.g., SalesHistory)
 */
export interface ShopScopedBaseEntity {
  id: number;
  shopId: number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for shop-scoped entities with code and title
 * (e.g., SKUs, Brands, Categories, Marketplaces)
 */
export interface CodedShopScopedEntity extends ShopScopedBaseEntity {
  code: string;
  title: string;
}
