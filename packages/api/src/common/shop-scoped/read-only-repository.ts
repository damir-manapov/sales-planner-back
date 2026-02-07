import type { PaginatedResponse, PaginationQuery } from '@sales-planner/shared';
import { assertValidTableName } from '../../database/index.js';
import type { DatabaseService, TableName } from '../../database/index.js';

/**
 * Interface for read-only shop-scoped repositories (materialized views)
 */
export interface IReadOnlyShopScopedRepository<TEntity> {
  countByShopId(shopId: number, query?: PaginationQuery): Promise<number>;
  findByShopId(shopId: number, query?: PaginationQuery): Promise<TEntity[]>;
  findByShopIdPaginated(
    shopId: number,
    query?: PaginationQuery,
  ): Promise<PaginatedResponse<TEntity>>;
  findById(id: number): Promise<TEntity | undefined>;
}

/**
 * Base repository for read-only shop-scoped entities (materialized views)
 *
 * Provides only read operations - no create, update, or delete.
 *
 * @typeParam TEntity - The entity type
 */
export abstract class ReadOnlyShopScopedRepository<TEntity>
  implements IReadOnlyShopScopedRepository<TEntity>
{
  protected readonly tableName: TableName;

  constructor(
    protected readonly db: DatabaseService,
    tableName: string,
    allowedTables: readonly string[],
  ) {
    assertValidTableName(tableName, allowedTables);
    this.tableName = tableName;
  }

  async countByShopId(shopId: number, query?: PaginationQuery): Promise<number> {
    let q = this.db
      .selectFrom(this.tableName as any)
      .select(this.db.fn.countAll<number>().as('count'))
      .where('shop_id', '=', shopId);

    if (query?.ids && query.ids.length > 0) {
      q = q.where('id', 'in', query.ids);
    }

    const result = await q.executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async findById(id: number): Promise<TEntity | undefined> {
    return this.db
      .selectFrom(this.tableName as any)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst() as Promise<TEntity | undefined>;
  }

  async findByShopId(shopId: number, query?: PaginationQuery): Promise<TEntity[]> {
    let q = this.db
      .selectFrom(this.tableName as any)
      .selectAll()
      .where('shop_id', '=', shopId);

    if (query?.ids && query.ids.length > 0) {
      q = q.where('id', 'in', query.ids);
    }

    q = q.orderBy('id' as any, 'asc');

    if (query?.limit !== undefined) {
      q = q.limit(query.limit);
    }
    if (query?.offset !== undefined) {
      q = q.offset(query.offset);
    }

    return q.execute() as Promise<TEntity[]>;
  }

  async findByShopIdPaginated(
    shopId: number,
    query: PaginationQuery = {},
  ): Promise<PaginatedResponse<TEntity>> {
    const { limit, offset } = query;

    const [total, items] = await Promise.all([
      this.countByShopId(shopId, query),
      this.findByShopId(shopId, query),
    ]);

    return { items, total, limit: limit ?? 0, offset: offset ?? 0 };
  }
}
