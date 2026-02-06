import type {
  CodedTitledItem,
  CodedShopScopedEntity,
} from '@sales-planner/shared';
import type { IShopScopedBaseRepository } from './base-repository.interface.js';

/**
 * Interface for shop-scoped repository with code operations
 * @typeParam TEntity - The entity type (must extend CodedShopScopedEntity)
 * @typeParam TCreateDto - The DTO type for create operations
 * @typeParam TUpdateDto - The DTO type for update operations
 * @typeParam TExport - The type for export operations (defaults to CodedTitledItem)
 * @typeParam TImportItem - The type for bulk import items (defaults to CodedTitledItem)
 */
export interface ICodedShopScopedRepository<
  TEntity extends CodedShopScopedEntity,
  TCreateDto = Partial<TEntity>,
  TUpdateDto = Partial<TEntity>,
  TExport = CodedTitledItem,
  TImportItem extends CodedTitledItem = CodedTitledItem,
> extends IShopScopedBaseRepository<TEntity, TCreateDto, TUpdateDto, TExport, TImportItem> {
  findByCodeAndShop(code: string, shopId: number): Promise<TEntity | undefined>;
  findCodesByShopId(shopId: number, codes: string[]): Promise<Set<string>>;
  findOrCreateByCode(
    tenantId: number,
    shopId: number,
    codes: string[],
  ): Promise<{ codeToId: Map<string, number>; created: number }>;
}
