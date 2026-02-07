import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CompetitorProduct,
  CompetitorProductExportItem,
  ImportResult,
  PaginatedResponse,
} from '@sales-planner/shared';
import { DuplicateResourceException, isUniqueViolation } from '../../common/index.js';
import { DatabaseService } from '../../database/index.js';
import { MarketplacesService } from '../marketplaces/marketplaces.service.js';
import type {
  CompetitorProductQuery,
  CreateCompetitorProductDto,
  ImportCompetitorProductItem,
  UpdateCompetitorProductDto,
} from './competitor-products.schema.js';
import { ImportCompetitorProductItemSchema } from './competitor-products.schema.js';

export type { CompetitorProduct };

/** Input item for findOrCreateBatch - marketplace ID + product ID pair */
export interface CompetitorProductLookupItem {
  marketplaceId: number;
  marketplaceProductId: string;
}

@Injectable()
export class CompetitorProductsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly marketplacesService: MarketplacesService,
  ) {}

  async findAll(): Promise<CompetitorProduct[]> {
    return this.db.selectFrom('competitor_products').selectAll().execute();
  }

  async findById(id: number): Promise<CompetitorProduct | undefined> {
    return this.db
      .selectFrom('competitor_products')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async findByShopId(shopId: number): Promise<CompetitorProduct[]> {
    return this.db
      .selectFrom('competitor_products')
      .selectAll()
      .where('shop_id', '=', shopId)
      .execute();
  }

  async findByShopIdPaginated(
    shopId: number,
    query?: CompetitorProductQuery,
  ): Promise<PaginatedResponse<CompetitorProduct>> {
    const { limit = 100, offset = 0 } = query ?? {};

    const baseQuery = this.db.selectFrom('competitor_products').where('shop_id', '=', shopId);

    const { count } = await baseQuery
      .select((eb) => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow();

    const items = await baseQuery.selectAll().limit(limit).offset(offset).execute();

    return { items, total: Number(count), limit, offset };
  }

  async create(dto: CreateCompetitorProductDto): Promise<CompetitorProduct> {
    try {
      return await this.db
        .insertInto('competitor_products')
        .values({
          shop_id: dto.shop_id,
          tenant_id: dto.tenant_id,
          marketplace_id: dto.marketplace_id,
          marketplace_product_id: dto.marketplace_product_id,
          title: dto.title ?? null,
          brand: dto.brand ?? null,
          updated_at: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException(
          'Competitor Product',
          `marketplace ${dto.marketplace_id} product ${dto.marketplace_product_id}`,
          'this shop',
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateCompetitorProductDto): Promise<CompetitorProduct> {
    const result = await this.db
      .updateTable('competitor_products')
      .set({ ...dto, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      throw new NotFoundException(`Competitor product with id ${id} not found`);
    }
    return result;
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('competitor_products').where('id', '=', id).execute();
  }

  async deleteByShopId(shopId: number): Promise<number> {
    const result = await this.db
      .deleteFrom('competitor_products')
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  /**
   * Find or create a competitor product by marketplace and marketplace_product_id.
   * Used for auto-creating when importing sku_competitor_mappings or competitor_sales.
   */
  async findOrCreate(
    tenantId: number,
    shopId: number,
    marketplaceId: number,
    marketplaceProductId: string,
  ): Promise<CompetitorProduct> {
    // Try to find existing
    const existing = await this.db
      .selectFrom('competitor_products')
      .selectAll()
      .where('shop_id', '=', shopId)
      .where('marketplace_id', '=', marketplaceId)
      .where('marketplace_product_id', '=', marketplaceProductId)
      .executeTakeFirst();

    if (existing) {
      return existing;
    }

    // Create new with empty title/brand
    return this.db
      .insertInto('competitor_products')
      .values({
        shop_id: shopId,
        tenant_id: tenantId,
        marketplace_id: marketplaceId,
        marketplace_product_id: marketplaceProductId,
        title: null,
        brand: null,
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['shop_id', 'marketplace_id', 'marketplace_product_id']).doNothing(),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Batch find or create competitor products.
   * Returns a map of (marketplaceId, marketplaceProductId) → competitorProductId
   */
  async findOrCreateBatch(
    tenantId: number,
    shopId: number,
    items: CompetitorProductLookupItem[],
  ): Promise<Map<string, number>> {
    if (items.length === 0) {
      return new Map();
    }

    // Insert all, ignoring conflicts
    // Title defaults to marketplace_product_id when auto-creating
    const values = items.map((item) => ({
      shop_id: shopId,
      tenant_id: tenantId,
      marketplace_id: item.marketplaceId,
      marketplace_product_id: item.marketplaceProductId,
      title: item.marketplaceProductId,
      brand: null,
      updated_at: new Date(),
    }));

    await this.db
      .insertInto('competitor_products')
      .values(values)
      .onConflict((oc) =>
        oc.columns(['shop_id', 'marketplace_id', 'marketplace_product_id']).doNothing(),
      )
      .execute();

    // Fetch all matching records
    const uniqueItems = [
      ...new Set(items.map((i) => `${i.marketplaceId}:${i.marketplaceProductId}`)),
    ];
    const marketplaceIds = [...new Set(items.map((i) => i.marketplaceId))];

    const records = await this.db
      .selectFrom('competitor_products')
      .select(['id', 'marketplace_id', 'marketplace_product_id'])
      .where('shop_id', '=', shopId)
      .where('marketplace_id', 'in', marketplaceIds)
      .execute();

    // Build lookup map
    const result = new Map<string, number>();
    for (const record of records) {
      const key = `${record.marketplace_id}:${record.marketplace_product_id}`;
      if (uniqueItems.includes(key)) {
        result.set(key, record.id);
      }
    }

    return result;
  }

  async upsert(dto: CreateCompetitorProductDto): Promise<CompetitorProduct> {
    return this.db
      .insertInto('competitor_products')
      .values({
        shop_id: dto.shop_id,
        tenant_id: dto.tenant_id,
        marketplace_id: dto.marketplace_id,
        marketplace_product_id: dto.marketplace_product_id,
        title: dto.title ?? null,
        brand: dto.brand ?? null,
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['shop_id', 'marketplace_id', 'marketplace_product_id']).doUpdateSet({
          title: dto.title ?? null,
          brand: dto.brand ?? null,
          updated_at: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async bulkUpsert(
    tenantId: number,
    shopId: number,
    items: ImportCompetitorProductItem[],
  ): Promise<ImportResult> {
    if (items.length === 0) {
      return { created: 0, updated: 0, errors: [] };
    }

    const errors: string[] = [];
    const validatedItems: ImportCompetitorProductItem[] = [];

    items.forEach((item, i) => {
      const result = ImportCompetitorProductItemSchema.safeParse(item);
      if (!result.success) {
        const errorMessages = result.error.issues.map((issue) => issue.message).join(', ');
        errors.push(`Invalid item at index ${i}: ${errorMessages}`);
        return;
      }
      validatedItems.push(result.data);
    });

    if (validatedItems.length === 0) {
      return { created: 0, updated: 0, errors };
    }

    // Find or create marketplaces by code
    const marketplaceCodes = validatedItems.map((i) =>
      this.marketplacesService.normalizeCode(i.marketplace),
    );
    const { codeToId: marketplaceCodeToId } = await this.marketplacesService.findOrCreateByCode(
      tenantId,
      shopId,
      marketplaceCodes,
    );

    // Prepare items with resolved marketplace IDs
    interface PreparedItem extends ImportCompetitorProductItem {
      marketplace_id: number;
    }
    const validItems: PreparedItem[] = [];

    validatedItems.forEach((item) => {
      const normalizedMarketplace = this.marketplacesService.normalizeCode(item.marketplace);
      const marketplaceId = marketplaceCodeToId.get(normalizedMarketplace);

      if (!marketplaceId) {
        errors.push(`Marketplace not found: ${item.marketplace}`);
        return;
      }

      validItems.push({
        ...item,
        marketplace_id: marketplaceId,
      });
    });

    if (validItems.length === 0) {
      return { created: 0, updated: 0, errors };
    }

    // Bulk upsert
    const values = validItems.map((item) => ({
      shop_id: shopId,
      tenant_id: tenantId,
      marketplace_id: item.marketplace_id,
      marketplace_product_id: item.marketplaceProductId,
      title: item.title ?? null,
      brand: item.brand ?? null,
      updated_at: new Date(),
    }));

    await this.db
      .insertInto('competitor_products')
      .values(values)
      .onConflict((oc) =>
        oc.columns(['shop_id', 'marketplace_id', 'marketplace_product_id']).doUpdateSet((eb) => ({
          title: eb.ref('excluded.title'),
          brand: eb.ref('excluded.brand'),
          updated_at: new Date(),
        })),
      )
      .execute();

    return { created: validItems.length, updated: 0, errors };
  }

  async exportCsv(shopId: number): Promise<CompetitorProductExportItem[]> {
    const rows = await this.db
      .selectFrom('competitor_products')
      .innerJoin('marketplaces', 'marketplaces.id', 'competitor_products.marketplace_id')
      .select([
        'marketplaces.code as marketplace',
        'competitor_products.marketplace_product_id',
        'competitor_products.title',
        'competitor_products.brand',
      ])
      .where('competitor_products.shop_id', '=', shopId)
      .execute();

    return rows.map((row) => ({
      marketplace: row.marketplace,
      marketplace_product_id: row.marketplace_product_id,
      title: row.title ?? undefined,
      brand: row.brand ?? undefined,
    }));
  }
}
