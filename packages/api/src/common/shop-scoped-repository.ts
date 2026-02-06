import type { PaginatedResponse, PaginationQuery, ShopScopedEntity } from '@sales-planner/shared';
import { assertValidTableName } from '../database/index.js';
import type { DatabaseService, TableName } from '../database/index.js';
import type { IShopScopedRepository } from './shop-scoped-repository.interface.js';

export type { IShopScopedRepository } from './shop-scoped-repository.interface.js';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;

/**
 * Base repository for shop-scoped entities
 * Provides pure data access operations without business logic
 *
 * Table name is validated at runtime against the provided whitelist
 * to prevent SQL injection via invalid table names.
 *
 * @typeParam TEntity - The entity type
 * @typeParam TCreateDto - The DTO type for create operations (defaults to Partial<TEntity>)
 * @typeParam TUpdateDto - The DTO type for update operations (defaults to Partial<TEntity>)
 */
export abstract class ShopScopedRepository<
  TEntity extends ShopScopedEntity,
  TCreateDto = Partial<TEntity>,
  TUpdateDto = Partial<TEntity>,
> implements IShopScopedRepository<TEntity, TCreateDto, TUpdateDto>
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

  async countByShopId(shopId: number): Promise<number> {
    const result = await this.db
      .selectFrom(this.tableName as any)
      .select(this.db.fn.countAll<number>().as('count'))
      .where('shop_id', '=', shopId)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async findById(id: number): Promise<TEntity | undefined> {
    return this.db
      .selectFrom(this.tableName as any)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst() as Promise<TEntity | undefined>;
  }

  async findByShopId(shopId: number): Promise<TEntity[]> {
    return this.db
      .selectFrom(this.tableName as any)
      .selectAll()
      .where('shop_id', '=', shopId)
      .execute() as Promise<TEntity[]>;
  }

  async findByShopIdPaginated(
    shopId: number,
    query: PaginationQuery = {},
  ): Promise<PaginatedResponse<TEntity>> {
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = query.offset ?? 0;

    const [total, items] = await Promise.all([
      this.countByShopId(shopId),
      this.db
        .selectFrom(this.tableName as any)
        .selectAll()
        .where('shop_id', '=', shopId)
        .orderBy('id', 'asc')
        .limit(limit)
        .offset(offset)
        .execute() as Promise<TEntity[]>,
    ]);

    return { items, total, limit, offset };
  }

  async findByCodeAndShop(code: string, shopId: number): Promise<TEntity | undefined> {
    return this.db
      .selectFrom(this.tableName as any)
      .selectAll()
      .where('code', '=', code)
      .where('shop_id', '=', shopId)
      .executeTakeFirst() as Promise<TEntity | undefined>;
  }

  async findCodesByShopId(shopId: number, codes: string[]): Promise<Set<string>> {
    const rows = await this.db
      .selectFrom(this.tableName as any)
      .select('code')
      .where('shop_id', '=', shopId)
      .where('code', 'in', codes)
      .execute();
    return new Set(rows.map((r: { code: string }) => r.code));
  }

  /** Immutable fields that should never be updated */
  private static readonly IMMUTABLE_FIELDS = new Set<string>(['id', 'shop_id', 'tenant_id', 'created_at', 'updated_at']);

  async create(data: TCreateDto): Promise<TEntity> {
    const result = await this.db
      .insertInto(this.tableName as any)
      .values({
        ...(data as object),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result as TEntity;
  }

  async update(id: number, data: TUpdateDto): Promise<TEntity | undefined> {
    const updateData: Record<string, unknown> = { updated_at: new Date() };

    for (const [key, value] of Object.entries(data as object)) {
      if (value !== undefined && !ShopScopedRepository.IMMUTABLE_FIELDS.has(key)) {
        updateData[key] = value;
      }
    }

    const result = await this.db
      .updateTable(this.tableName as any)
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return result as TEntity | undefined;
  }

  async delete(id: number): Promise<void> {
    await this.db
      .deleteFrom(this.tableName as any)
      .where('id', '=', id)
      .execute();
  }

  async deleteByShopId(shopId: number): Promise<number> {
    const result = await this.db
      .deleteFrom(this.tableName as any)
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }
}
