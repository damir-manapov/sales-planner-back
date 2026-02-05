import type { ShopScopedEntity } from '@sales-planner/shared';
import { DuplicateResourceException, isUniqueViolation } from './exceptions.js';
import type { DatabaseService } from '../database/index.js';

export interface CreateEntityDto {
  code: string;
  title: string;
  shop_id: number;
  tenant_id: number;
}

export interface UpdateEntityDto {
  title?: string;
}

export interface ImportEntityItem {
  code: string;
  title: string;
}

export interface BulkUpsertResult {
  created: number;
  updated: number;
  errors: string[];
}

/**
 * Base service for shop-scoped entities (brands, SKUs, etc.)
 * Provides common CRUD and bulk import operations
 */
export abstract class BaseEntityService<
  TEntity extends ShopScopedEntity,
  TCreateDto extends CreateEntityDto,
  TUpdateDto extends UpdateEntityDto,
  TImportItem extends ImportEntityItem,
> {
  constructor(
    protected readonly db: DatabaseService,
    protected readonly tableName: string,
  ) {}

  /**
   * Optional code normalization - override in subclass if needed
   */
  protected normalizeCode(code: string): string {
    return code;
  }

  /**
   * Validate import item - override in subclass to use specific schema
   */
  protected abstract validateImportItem(item: unknown): {
    success: boolean;
    data?: TImportItem;
    error?: { issues: Array<{ message: string }> };
  };

  async findAll(): Promise<TEntity[]> {
    return this.db
      .selectFrom(this.tableName as any)
      .selectAll()
      .execute() as Promise<TEntity[]>;
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

  async findByTenantId(tenantId: number): Promise<TEntity[]> {
    return this.db
      .selectFrom(this.tableName as any)
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .execute() as Promise<TEntity[]>;
  }

  async findByCodeAndShop(code: string, shopId: number): Promise<TEntity | undefined> {
    const normalizedCode = this.normalizeCode(code);
    return this.db
      .selectFrom(this.tableName as any)
      .selectAll()
      .where('code', '=', normalizedCode)
      .where('shop_id', '=', shopId)
      .executeTakeFirst() as Promise<TEntity | undefined>;
  }

  async create(dto: TCreateDto): Promise<TEntity> {
    try {
      const normalizedCode = this.normalizeCode(dto.code);
      const result = await this.db
        .insertInto(this.tableName as any)
        .values({
          code: normalizedCode,
          title: dto.title,
          shop_id: dto.shop_id,
          tenant_id: dto.tenant_id,
          updated_at: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return result as TEntity;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException(this.tableName.slice(0, -1), dto.code, 'this shop');
      }
      throw error;
    }
  }

  async update(id: number, dto: TUpdateDto): Promise<TEntity | undefined> {
    const result = await this.db
      .updateTable(this.tableName as any)
      .set({
        ...dto,
        updated_at: new Date(),
      })
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

  async deleteByShopId(shopId: number): Promise<undefined | number> {
    await this.db
      .deleteFrom(this.tableName as any)
      .where('shop_id', '=', shopId)
      .execute();
    // Return undefined by default, subclasses can override to return count
    return undefined;
  }

  async bulkUpsert(items: unknown[], shopId: number, tenantId: number): Promise<BulkUpsertResult> {
    const validItems: TImportItem[] = [];
    const errors: string[] = [];

    items.forEach((item, index) => {
      const result = this.validateImportItem(item);

      if (!result.success || !result.data) {
        const identifier =
          typeof item === 'object' && item && 'code' in item
            ? (item as any).code
            : `at index ${index}`;
        const errorMessages =
          result.error?.issues.map((issue) => issue.message).join(', ') || 'Invalid item';
        errors.push(`Invalid item "${identifier}": ${errorMessages}`);
        return;
      }

      validItems.push(result.data);
    });

    if (validItems.length === 0) {
      return { created: 0, updated: 0, errors };
    }

    // Get existing codes for this shop in one query
    const existingCodes = new Set(
      (
        await this.db
          .selectFrom(this.tableName as any)
          .select('code')
          .where('shop_id', '=', shopId)
          .where(
            'code',
            'in',
            validItems.map((i) => this.normalizeCode(i.code)),
          )
          .execute()
      ).map((r: any) => r.code),
    );

    // Use ON CONFLICT for efficient upsert
    await this.db
      .insertInto(this.tableName as any)
      .values(
        validItems.map((item) => ({
          code: this.normalizeCode(item.code),
          title: item.title,
          shop_id: shopId,
          tenant_id: tenantId,
          updated_at: new Date(),
        })),
      )
      .onConflict((oc) =>
        oc.columns(['code', 'shop_id']).doUpdateSet({
          title: (eb: any) => eb.ref('excluded.title'),
          updated_at: new Date(),
        }),
      )
      .execute();

    const created = validItems.filter((i) => !existingCodes.has(this.normalizeCode(i.code))).length;
    const updated = validItems.filter((i) => existingCodes.has(this.normalizeCode(i.code))).length;

    return { created, updated, errors };
  }

  async exportForShop(shopId: number): Promise<Array<{ code: string; title: string }>> {
    const items = await this.db
      .selectFrom(this.tableName as any)
      .select(['code', 'title'])
      .where('shop_id', '=', shopId)
      .orderBy('code', 'asc')
      .execute();

    return items as Array<{ code: string; title: string }>;
  }

  /**
   * Finds entities by code or creates missing ones.
   * Returns a map of code -> id and the count of newly created entities.
   * Useful for auto-creating referenced entities during imports.
   */
  async findOrCreateByCode(
    codes: string[],
    shopId: number,
    tenantId: number,
  ): Promise<{ codeToId: Map<string, number>; created: number }> {
    if (codes.length === 0) {
      return { codeToId: new Map(), created: 0 };
    }

    const normalizedCodes = codes.map((code) => this.normalizeCode(code));
    const uniqueCodes = [...new Set(normalizedCodes)];

    let entities = (await this.db
      .selectFrom(this.tableName as any)
      .select(['id', 'code'])
      .where('shop_id', '=', shopId)
      .where('code', 'in', uniqueCodes)
      .execute()) as Array<{ id: number; code: string }>;

    const existingCodes = new Set(entities.map((e) => e.code));
    const missingCodes = uniqueCodes.filter((code) => !existingCodes.has(code));

    if (missingCodes.length > 0) {
      const newEntities = (await this.db
        .insertInto(this.tableName as any)
        .values(
          missingCodes.map((code) => ({
            code,
            title: code,
            shop_id: shopId,
            tenant_id: tenantId,
            updated_at: new Date(),
          })),
        )
        .returning(['id', 'code'])
        .execute()) as Array<{ id: number; code: string }>;

      entities = [...entities, ...newEntities];
    }

    return {
      codeToId: new Map(entities.map((e) => [e.code, e.id])),
      created: missingCodes.length,
    };
  }
}
