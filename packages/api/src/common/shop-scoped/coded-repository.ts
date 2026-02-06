import type { CodedTitledItem, CodedShopScopedEntity } from '@sales-planner/shared';
import type { ICodedShopScopedRepository } from './coded-repository.interface.js';
import { ShopScopedBaseRepository } from './base-repository.js';

export type { ICodedShopScopedRepository } from './coded-repository.interface.js';

/**
 * Repository for shop-scoped entities with code/title
 * Extends base with code-specific operations (findByCode, findOrCreateByCode, etc.)
 *
 * @typeParam TEntity - The entity type
 * @typeParam TCreateDto - The DTO type for create operations (defaults to Partial<TEntity>)
 * @typeParam TUpdateDto - The DTO type for update operations (defaults to Partial<TEntity>)
 * @typeParam TExport - The type for export operations (defaults to CodedTitledItem)
 * @typeParam TImportItem - The type for bulk import items (defaults to CodedTitledItem)
 */
export abstract class CodedShopScopedRepository<
    TEntity extends CodedShopScopedEntity,
    TCreateDto = Partial<TEntity>,
    TUpdateDto = Partial<TEntity>,
    TExport = CodedTitledItem,
    TImportItem extends CodedTitledItem = CodedTitledItem,
  >
  extends ShopScopedBaseRepository<TEntity, TCreateDto, TUpdateDto, TExport, TImportItem>
  implements ICodedShopScopedRepository<TEntity, TCreateDto, TUpdateDto, TExport, TImportItem>
{
  /** Override to include code/title in export */
  protected override readonly exportFields: readonly string[] = ['code', 'title'];

  /** Override unique keys for code-based conflict resolution */
  protected override readonly uniqueKeys: readonly string[] = ['code', 'shop_id'];

  /** Code is the business primary key */
  protected override readonly businessPrimaryKey = 'code';

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

  /**
   * Finds entities by code or creates missing ones.
   * Returns a map of code -> id and the count of newly created entities.
   * Useful for auto-creating referenced entities during imports.
   */
  async findOrCreateByCode(
    tenantId: number,
    shopId: number,
    codes: string[],
  ): Promise<{ codeToId: Map<string, number>; created: number }> {
    if (codes.length === 0) {
      return { codeToId: new Map(), created: 0 };
    }

    const uniqueCodes = [...new Set(codes)];

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
