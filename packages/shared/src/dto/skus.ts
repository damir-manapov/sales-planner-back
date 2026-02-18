import type { CodedTitledItem, CodedTitledShopScopedCreateDto, CodedTitledUpdateDto } from './base';

/** SKU optional fields */
interface SkuOptionalFields {
  title2?: string;
  categoryId?: number;
  groupId?: number;
  statusId?: number;
  supplierId?: number;
}

export interface CreateSkuRequest extends CodedTitledItem, SkuOptionalFields {}

export interface CreateSkuDto extends CodedTitledShopScopedCreateDto, SkuOptionalFields {}

export interface UpdateSkuDto extends CodedTitledUpdateDto, SkuOptionalFields {}
export type UpdateSkuRequest = UpdateSkuDto;

export interface ImportSkuItem extends CodedTitledItem {
  title2?: string;
  category?: string;
  group?: string;
  status?: string;
  supplier?: string;
}
