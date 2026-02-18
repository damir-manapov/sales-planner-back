import type { CodedShopScopedEntity } from './base';

export interface Sku extends CodedShopScopedEntity {
  title2?: string | null;
  categoryId?: number | null;
  groupId?: number | null;
  statusId?: number | null;
  supplierId?: number | null;
}
