import type {
  PaginatedResponse,
  PaginationQuery,
  ShopScopedBaseEntity,
} from '@sales-planner/shared';
import { assertValidTableName } from '../../database/index.js';
import type { DatabaseService, TableName } from '../../database/index.js';
import type { BulkUpsertResult } from '../internal-types.js';
import type { IShopScopedBaseRepository } from './base-repository.interface.js';

export type { IShopScopedBaseRepository } from './base-repository.interface.js';

/**
 * Base repository for shop-scoped entities (without code operations)
 * Provides pure data access operations without business logic
 *
 * Table name is validated at runtime against the provided whitelist
 * to prevent SQL injection via invalid table names.
 *
 * @typeParam TEntity - The entity type
 * @typeParam TCreateDto - The DTO type for create operations (defaults to Partial<TEntity>)
 * @typeParam TUpdateDto - The DTO type for update operations (defaults to Partial<TEntity>)
 * @typeParam TExport - The type for export operations
 * @typeParam TImportItem - The type for bulk import items
 */
export abstract class ShopScopedBaseRepository<
  TEntity extends ShopScopedBaseEntity,
  TCreateDto = Partial<TEntity>,
  TUpdateDto = Partial<TEntity>,
  TExport = Record<string, unknown>,
  TImportItem = Record<string, unknown>,
> implements IShopScopedBaseRepository<TEntity, TCreateDto, TUpdateDto, TExport, TImportItem>
{
  protected readonly tableName: TableName;

  /** Fields to include in exportForShop. Override in subclass to specify fields. */
  protected readonly exportFields: readonly string[] = [];

  /** Unique key columns for upsert conflict resolution. Override in subclass. */
  protected readonly uniqueKeys: readonly string[] = ['id'];

  /** Business primary key for counting existing records in bulkUpsert. If not set, uses first uniqueKey that isn't shop_id. */
  protected readonly businessPrimaryKey?: string;

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

  async findAll(): Promise<TEntity[]> {
    return this.db
      .selectFrom(this.tableName as any)
      .selectAll()
      .orderBy('id', 'asc')
      .execute() as Promise<TEntity[]>;
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
      .where('shop_id', '=', shopId)
      .orderBy('id', 'asc');

    if (query?.limit !== undefined) {
      q = q.limit(query.limit);
    }
    if (query?.offset !== undefined) {
      q = q.offset(query.offset);
    }

    return q.execute() as Promise<TEntity[]>;
  }

  async findByTenantId(tenantId: number): Promise<TEntity[]> {
    return this.db
      .selectFrom(this.tableName as any)
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .orderBy('id', 'asc')
      .execute() as Promise<TEntity[]>;
  }

  async findByShopIdPaginated(
    shopId: number,
    query: PaginationQuery = {},
  ): Promise<PaginatedResponse<TEntity>> {
    const { limit, offset } = query;

    const [total, items] = await Promise.all([
      this.countByShopId(shopId),
      this.findByShopId(shopId, query),
    ]);

    return { items, total, limit: limit ?? 0, offset: offset ?? 0 };
  }

  /** Immutable fields that should never be updated */
  protected static readonly IMMUTABLE_FIELDS = new Set<string>(['id', 'shop_id', 'tenant_id', 'created_at', 'updated_at']);

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
      if (value !== undefined && !ShopScopedBaseRepository.IMMUTABLE_FIELDS.has(key)) {
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

  async exportForShop(shopId: number): Promise<TExport[]> {
    return this.db
      .selectFrom(this.tableName as any)
      .select(this.exportFields.slice() as any)
      .where('shop_id', '=', shopId)
      .orderBy('id', 'asc')
      .execute() as Promise<TExport[]>;
  }

  /**
   * Bulk upsert items. Returns counts of created and updated items.
   * Updates all fields from items except immutable ones.
   */
  async bulkUpsert(tenantId: number, shopId: number, items: TImportItem[]): Promise<BulkUpsertResult> {
    if (items.length === 0) {
      return { created: 0, updated: 0 };
    }

    // Get business primary key for counting existing records
    const primaryKey = this.businessPrimaryKey ?? this.uniqueKeys.find((k) => k !== 'shop_id') ?? 'id';
    const keyValues = items.map((item) => (item as Record<string, unknown>)[primaryKey]);

    // Count existing records by unique key
    const existingResult = await this.db
      .selectFrom(this.tableName as any)
      .select(this.db.fn.countAll<number>().as('count'))
      .where('shop_id', '=', shopId)
      .where(primaryKey as any, 'in', keyValues)
      .executeTakeFirstOrThrow();

    const updated = Number(existingResult.count);
    const created = items.length - updated;

    // Build update set for all non-immutable fields from first item
    const sampleItem = items[0] as Record<string, unknown>;
    const updateSet: Record<string, unknown> = { updated_at: new Date() };
    for (const key of Object.keys(sampleItem)) {
      if (!ShopScopedBaseRepository.IMMUTABLE_FIELDS.has(key)) {
        updateSet[key] = (eb: any) => eb.ref(`excluded.${key}`);
      }
    }

    await this.db
      .insertInto(this.tableName as any)
      .values(
        items.map((item) => ({
          ...(item as object),
          shop_id: shopId,
          tenant_id: tenantId,
          updated_at: new Date(),
        })),
      )
      .onConflict((oc) =>
        oc.columns(this.uniqueKeys.slice() as any).doUpdateSet(updateSet as any),
      )
      .execute();

    return { created, updated };
  }
}
