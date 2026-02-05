import type { ShopScopedEntity } from './base';

export interface Sku extends ShopScopedEntity {
  category_id?: number | null;
  group_id?: number | null;
  status_id?: number | null;
  supplier_id?: number | null;
}
