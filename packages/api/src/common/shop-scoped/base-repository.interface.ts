import type {
  PaginatedResponse,
  PaginationQuery,
  ShopScopedBaseEntity,
} from '@sales-planner/shared';
import type { BulkUpsertResult } from '../internal-types.js';

/**
 * Base interface for shop-scoped repository operations (without code)
 * @typeParam TEntity - The entity type (must extend ShopScopedBaseEntity)
 * @typeParam TCreateDto - The DTO type for create operations
 * @typeParam TUpdateDto - The DTO type for update operations
 * @typeParam TExport - The type for export operations
 * @typeParam TImportItem - The type for bulk import items
 */
export interface IShopScopedBaseRepository<
  TEntity extends ShopScopedBaseEntity,
  TCreateDto = Partial<TEntity>,
  TUpdateDto = Partial<TEntity>,
  TExport = Record<string, unknown>,
  TImportItem = Record<string, unknown>,
> {
  countByShopId(shopId: number, query?: PaginationQuery): Promise<number>;
  findAll(): Promise<TEntity[]>;
  findById(id: number): Promise<TEntity | undefined>;
  findByShopId(shopId: number, query?: PaginationQuery): Promise<TEntity[]>;
  findByTenantId(tenantId: number): Promise<TEntity[]>;
  findByShopIdPaginated(
    shopId: number,
    query?: PaginationQuery,
  ): Promise<PaginatedResponse<TEntity>>;
  create(data: TCreateDto): Promise<TEntity>;
  update(id: number, data: TUpdateDto): Promise<TEntity | undefined>;
  delete(id: number): Promise<void>;
  deleteByShopId(shopId: number): Promise<number>;
  exportForShop(shopId: number): Promise<TExport[]>;
  bulkUpsert(tenantId: number, shopId: number, items: TImportItem[]): Promise<BulkUpsertResult>;
}
