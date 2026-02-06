import type { CodedTitledItem, CodedTitledShopScopedCreateDto, CodedTitledUpdateDto } from './base';

/** SKU optional fields */
interface SkuOptionalFields {
  title2?: string;
  category_id?: number;
  group_id?: number;
  status_id?: number;
  supplier_id?: number;
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
