/**
 * Base interfaces for API DTOs
 */

/** Base create DTO with code, title, and shop/tenant context */
export interface CodedTitledShopScopedCreateDto {
  code: string;
  title: string;
  shopId: number;
  tenantId: number;
}

/** Base update DTO with optional code and title */
export interface CodedTitledUpdateDto {
  code?: string;
  title?: string;
}

/** Base item with code and title */
export interface CodedTitledItem {
  code: string;
  title: string;
  [key: string]: unknown;
}
