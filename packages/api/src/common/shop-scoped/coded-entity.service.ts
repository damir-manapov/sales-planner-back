import type {
  CodedTitledItem,
  CodedTitledShopScopedCreateDto,
  CodedTitledUpdateDto,
  CodedShopScopedEntity,
  ImportResult,
} from '@sales-planner/shared';
import type { ZodSchema } from 'zod';
import { normalizeCode } from '../../lib/index.js';
import type { ICodedShopScopedRepository } from './coded-repository.interface.js';
import { ShopScopedBaseEntityService } from './base-entity.service.js';

/**
 * Service for shop-scoped entities with code/title
 * Extends base with code-specific operations (findByCode, bulkUpsert, etc.)
 */
export abstract class CodedShopScopedEntityService<
  TEntity extends CodedShopScopedEntity,
  TCreateDto extends CodedTitledShopScopedCreateDto,
  TUpdateDto extends CodedTitledUpdateDto,
  TImportItem extends CodedTitledItem,
> extends ShopScopedBaseEntityService<TEntity, TCreateDto, TUpdateDto> {
  constructor(
    protected readonly repository: ICodedShopScopedRepository<TEntity, TCreateDto, TUpdateDto>,
    protected readonly entityName: string,
    protected readonly importItemSchema: ZodSchema<TImportItem>,
  ) {
    super(repository, entityName);
  }

  /**
   * Code normalization - uses standard normalizeCode by default.
   * Override in subclass for custom normalization (e.g., SKUs).
   */
  public normalizeCode(code: string): string {
    return normalizeCode(code);
  }

  /**
   * Validate import item using the schema provided in constructor
   */
  protected validateImportItem(item: unknown) {
    return this.importItemSchema.safeParse(item);
  }

  protected override getCreateIdentifier(dto: TCreateDto): string {
    return dto.code;
  }

  protected override getUpdateIdentifier(dto: TUpdateDto): string {
    return dto.code ?? 'unknown';
  }

  async findByCodeAndShop(code: string, shopId: number): Promise<TEntity | undefined> {
    const normalizedCode = this.normalizeCode(code);
    return this.repository.findByCodeAndShop(normalizedCode, shopId);
  }

  override async create(dto: TCreateDto): Promise<TEntity> {
    const normalizedDto = {
      ...dto,
      code: this.normalizeCode(dto.code),
    };
    return super.create(normalizedDto);
  }

  async bulkUpsert(tenantId: number, shopId: number, items: TImportItem[]): Promise<ImportResult> {
    const validItems: TImportItem[] = [];
    const errors: string[] = [];

    items.forEach((item, index) => {
      const result = this.validateImportItem(item);

      if (!result.success || !result.data) {
        const identifier = item.code || `at index ${index}`;
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

    // Check for duplicate codes in input
    const codeCounts = new Map<string, number>();
    for (const item of validItems) {
      const code = this.normalizeCode(item.code);
      codeCounts.set(code, (codeCounts.get(code) || 0) + 1);
    }
    const duplicateCodes = [...codeCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([code, count]) => `"${code}" (${count} times)`);

    if (duplicateCodes.length > 0) {
      errors.push(
        `Duplicate ${this.entityName} codes found: ${duplicateCodes.slice(0, 5).join(', ')}${duplicateCodes.length > 5 ? ` and ${duplicateCodes.length - 5} more` : ''}`,
      );
      return { created: 0, updated: 0, errors };
    }

    const normalizedItems = validItems.map((item) => ({
      code: this.normalizeCode(item.code),
      title: item.title,
    }));

    const { created, updated } = await this.repository.bulkUpsert(
      tenantId,
      shopId,
      normalizedItems,
    );

    return { created, updated, errors };
  }

  async exportForShop(shopId: number): Promise<Array<{ code: string; title: string }>> {
    return this.repository.exportForShop(shopId) as Promise<Array<{ code: string; title: string }>>;
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

    const normalizedCodes = codes.map((code) => this.normalizeCode(code));
    return this.repository.findOrCreateByCode(tenantId, shopId, normalizedCodes);
  }
}
