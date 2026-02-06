import type { CodedTitledItem, CodedTitledShopScopedCreateDto, CodedTitledUpdateDto } from './base';

export type CreateMarketplaceRequest = CodedTitledItem;
export type CreateMarketplaceDto = CodedTitledShopScopedCreateDto;
export type UpdateMarketplaceDto = Omit<CodedTitledUpdateDto, 'code'>;
export type UpdateMarketplaceRequest = UpdateMarketplaceDto;
export type ImportMarketplaceItem = CodedTitledItem;
