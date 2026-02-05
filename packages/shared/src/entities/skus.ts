import type { ShopScopedEntity } from './base';

export interface Sku extends ShopScopedEntity {
  category_code?: string;
  group_code?: string;
  status_code?: string;
}
