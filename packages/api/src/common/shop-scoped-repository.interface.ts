import type { PaginatedResponse, PaginationQuery, ShopScopedEntity } from '@sales-planner/shared';

/**
 * Interface for shop-scoped repository operations
 * @typeParam TEntity - The entity type (must extend ShopScopedEntity)
 * @typeParam TCreateDto - The DTO type for create operations
 * @typeParam TUpdateDto - The DTO type for update operations
 */
export interface IShopScopedRepository<
  TEntity extends ShopScopedEntity,
  TCreateDto = Partial<TEntity>,
  TUpdateDto = Partial<TEntity>,
> {
  countByShopId(shopId: number): Promise<number>;
  findById(id: number): Promise<TEntity | undefined>;
  findByShopId(shopId: number): Promise<TEntity[]>;
  findByShopIdPaginated(shopId: number, query?: PaginationQuery): Promise<PaginatedResponse<TEntity>>;
  findByCodeAndShop(code: string, shopId: number): Promise<TEntity | undefined>;
  findCodesByShopId(shopId: number, codes: string[]): Promise<Set<string>>;
  create(data: TCreateDto): Promise<TEntity>;
  update(id: number, data: TUpdateDto): Promise<TEntity | undefined>;
  delete(id: number): Promise<void>;
  deleteByShopId(shopId: number): Promise<number>;
  exportForShop(shopId: number): Promise<Array<Record<string, unknown>>>;
  findOrCreateByCode(
    codes: string[],
    shopId: number,
    tenantId: number,
  ): Promise<{ codeToId: Map<string, number>; created: number }>;
}
