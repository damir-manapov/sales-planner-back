import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ImportResult,
  PaginatedResponse,
  SkuCompetitorMapping,
  SkuCompetitorMappingExportItem,
} from '@sales-planner/shared';
import { DuplicateResourceException, isUniqueViolation } from '../../common/index.js';
import { DatabaseService } from '../../database/index.js';
import type { CompetitorProductLookupItem } from '../competitor-products/competitor-products.service.js';
import { CompetitorProductsService } from '../competitor-products/competitor-products.service.js';
import { MarketplacesService } from '../marketplaces/marketplaces.service.js';
import { SkusService } from '../skus/skus.service.js';
import type {
  CreateSkuCompetitorMappingDto,
  ImportSkuCompetitorMappingItem,
  SkuCompetitorMappingQuery,
  UpdateSkuCompetitorMappingDto,
} from './sku-competitor-mappings.schema.js';
import { ImportSkuCompetitorMappingItemSchema } from './sku-competitor-mappings.schema.js';

export type { SkuCompetitorMapping };

interface PreparedSkuCompetitorMappingItem extends ImportSkuCompetitorMappingItem {
  sku_id: number;
  competitor_product_id: number;
}

@Injectable()
export class SkuCompetitorMappingsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly skusService: SkusService,
    private readonly marketplacesService: MarketplacesService,
    private readonly competitorProductsService: CompetitorProductsService,
  ) {}

  async findAll(): Promise<SkuCompetitorMapping[]> {
    return this.db.selectFrom('sku_competitor_mappings').selectAll().execute();
  }

  async findById(id: number): Promise<SkuCompetitorMapping | undefined> {
    return this.db
      .selectFrom('sku_competitor_mappings')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async findByShopId(shopId: number): Promise<SkuCompetitorMapping[]> {
    return this.db
      .selectFrom('sku_competitor_mappings')
      .selectAll()
      .where('shop_id', '=', shopId)
      .execute();
  }

  async findByShopIdPaginated(
    shopId: number,
    query?: SkuCompetitorMappingQuery,
  ): Promise<PaginatedResponse<SkuCompetitorMapping>> {
    const { limit = 100, offset = 0 } = query ?? {};

    const baseQuery = this.db.selectFrom('sku_competitor_mappings').where('shop_id', '=', shopId);

    const { count } = await baseQuery
      .select((eb) => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow();

    const items = await baseQuery.selectAll().limit(limit).offset(offset).execute();

    return { items, total: Number(count), limit, offset };
  }

  async create(dto: CreateSkuCompetitorMappingDto): Promise<SkuCompetitorMapping> {
    try {
      return await this.db
        .insertInto('sku_competitor_mappings')
        .values({
          shop_id: dto.shop_id,
          tenant_id: dto.tenant_id,
          sku_id: dto.sku_id,
          competitor_product_id: dto.competitor_product_id,
          updated_at: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException(
          'SKU Competitor Mapping',
          `SKU ${dto.sku_id} competitor product ${dto.competitor_product_id}`,
          'this shop',
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateSkuCompetitorMappingDto): Promise<SkuCompetitorMapping> {
    const result = await this.db
      .updateTable('sku_competitor_mappings')
      .set({ ...dto, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      throw new NotFoundException(`SKU competitor mapping with id ${id} not found`);
    }
    return result;
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('sku_competitor_mappings').where('id', '=', id).execute();
  }

  async deleteByShopId(shopId: number): Promise<number> {
    const result = await this.db
      .deleteFrom('sku_competitor_mappings')
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  async upsert(dto: CreateSkuCompetitorMappingDto): Promise<SkuCompetitorMapping> {
    return this.db
      .insertInto('sku_competitor_mappings')
      .values({
        shop_id: dto.shop_id,
        tenant_id: dto.tenant_id,
        sku_id: dto.sku_id,
        competitor_product_id: dto.competitor_product_id,
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['shop_id', 'sku_id', 'competitor_product_id']).doUpdateSet({
          updated_at: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async bulkUpsert(
    tenantId: number,
    shopId: number,
    items: ImportSkuCompetitorMappingItem[],
  ): Promise<ImportResult> {
    if (items.length === 0) {
      return { created: 0, updated: 0, errors: [] };
    }

    const errors: string[] = [];
    const validatedItems: ImportSkuCompetitorMappingItem[] = [];

    items.forEach((item, i) => {
      const result = ImportSkuCompetitorMappingItemSchema.safeParse(item);
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

    // Find or create SKUs by code
    const skuCodes = validatedItems.map((i) => this.skusService.normalizeCode(i.sku));
    const { codeToId: skuCodeToId } = await this.skusService.findOrCreateByCode(
      tenantId,
      shopId,
      skuCodes,
    );

    // Find or create marketplaces by code
    const marketplaceCodes = validatedItems.map((i) =>
      this.marketplacesService.normalizeCode(i.marketplace),
    );
    const { codeToId: marketplaceCodeToId } = await this.marketplacesService.findOrCreateByCode(
      tenantId,
      shopId,
      marketplaceCodes,
    );

    // Prepare competitor products lookup items
    const competitorProductItems: CompetitorProductLookupItem[] = [];
    const itemsWithMarketplaceId: Array<{
      item: ImportSkuCompetitorMappingItem;
      skuId: number;
      marketplaceId: number;
    }> = [];

    validatedItems.forEach((item) => {
      const normalizedSkuCode = this.skusService.normalizeCode(item.sku);
      const normalizedMarketplace = this.marketplacesService.normalizeCode(item.marketplace);
      const skuId = skuCodeToId.get(normalizedSkuCode);
      const marketplaceId = marketplaceCodeToId.get(normalizedMarketplace);

      if (!skuId) {
        errors.push(`SKU not found: ${item.sku}`);
        return;
      }
      if (!marketplaceId) {
        errors.push(`Marketplace not found: ${item.marketplace}`);
        return;
      }

      competitorProductItems.push({
        marketplaceId,
        marketplaceProductId: item.marketplaceProductId,
      });
      itemsWithMarketplaceId.push({ item, skuId, marketplaceId });
    });

    if (itemsWithMarketplaceId.length === 0) {
      return { created: 0, updated: 0, errors };
    }

    // Find or create competitor products (auto-create pattern)
    const competitorProductMap = await this.competitorProductsService.findOrCreateBatch(
      tenantId,
      shopId,
      competitorProductItems,
    );

    // Prepare final items with competitor_product_id
    const validItems: PreparedSkuCompetitorMappingItem[] = [];
    itemsWithMarketplaceId.forEach(({ item, skuId, marketplaceId }) => {
      const key = `${marketplaceId}:${item.marketplaceProductId}`;
      const competitorProductId = competitorProductMap.get(key);

      if (!competitorProductId) {
        errors.push(
          `Competitor product not found: marketplace ${item.marketplace} product ${item.marketplaceProductId}`,
        );
        return;
      }

      validItems.push({
        ...item,
        sku_id: skuId,
        competitor_product_id: competitorProductId,
      });
    });

    if (validItems.length === 0) {
      return { created: 0, updated: 0, errors };
    }

    // Bulk upsert
    const values = validItems.map((item) => ({
      shop_id: shopId,
      tenant_id: tenantId,
      sku_id: item.sku_id,
      competitor_product_id: item.competitor_product_id,
      updated_at: new Date(),
    }));

    await this.db
      .insertInto('sku_competitor_mappings')
      .values(values)
      .onConflict((oc) =>
        oc.columns(['shop_id', 'sku_id', 'competitor_product_id']).doUpdateSet({
          updated_at: new Date(),
        }),
      )
      .execute();

    return { created: validItems.length, updated: 0, errors };
  }

  async exportCsv(shopId: number): Promise<SkuCompetitorMappingExportItem[]> {
    const rows = await this.db
      .selectFrom('sku_competitor_mappings')
      .innerJoin('skus', 'skus.id', 'sku_competitor_mappings.sku_id')
      .innerJoin(
        'competitor_products',
        'competitor_products.id',
        'sku_competitor_mappings.competitor_product_id',
      )
      .innerJoin('marketplaces', 'marketplaces.id', 'competitor_products.marketplace_id')
      .select([
        'skus.code as sku',
        'marketplaces.code as marketplace',
        'competitor_products.marketplace_product_id',
      ])
      .where('sku_competitor_mappings.shop_id', '=', shopId)
      .execute();

    return rows.map((row) => ({
      sku: row.sku,
      marketplace: row.marketplace,
      marketplace_product_id: row.marketplace_product_id,
    }));
  }
}
