import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CompetitorSale,
  CompetitorSaleExportItem,
  ImportResult,
  PaginatedResponse,
} from '@sales-planner/shared';
import type { Selectable } from 'kysely';
import { DuplicateResourceException, isUniqueViolation } from '../../common/index.js';
import type { CompetitorSales as CompetitorSalesTable } from '../../database/database.types.js';
import { DatabaseService } from '../../database/index.js';
import { dateToPeriod, periodToDate } from '../../lib/index.js';
import type { CompetitorProductLookupItem } from '../competitor-products/competitor-products.service.js';
import { CompetitorProductsService } from '../competitor-products/competitor-products.service.js';
import { MarketplacesService } from '../marketplaces/marketplaces.service.js';
import type {
  CompetitorSaleQuery,
  CreateCompetitorSaleDto,
  ImportCompetitorSaleItem,
  UpdateCompetitorSaleDto,
} from './competitor-sales.schema.js';
import { ImportCompetitorSaleItemSchema } from './competitor-sales.schema.js';

export type { CompetitorSale };

type CompetitorSaleRow = Selectable<CompetitorSalesTable>;

interface PreparedCompetitorSaleItem extends ImportCompetitorSaleItem {
  competitor_product_id: number;
  periodDate: Date;
}

@Injectable()
export class CompetitorSalesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly marketplacesService: MarketplacesService,
    private readonly competitorProductsService: CompetitorProductsService,
  ) {}

  private mapRow(row: CompetitorSaleRow): CompetitorSale {
    return {
      ...row,
      period: dateToPeriod(row.period),
    };
  }

  async findAll(): Promise<CompetitorSale[]> {
    const rows = await this.db.selectFrom('competitor_sales').selectAll().execute();
    return rows.map((r) => this.mapRow(r));
  }

  async findById(id: number): Promise<CompetitorSale | undefined> {
    const row = await this.db
      .selectFrom('competitor_sales')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? this.mapRow(row) : undefined;
  }

  async findByShopId(shopId: number): Promise<CompetitorSale[]> {
    const rows = await this.db
      .selectFrom('competitor_sales')
      .selectAll()
      .where('shop_id', '=', shopId)
      .execute();
    return rows.map((r) => this.mapRow(r));
  }

  async findByShopAndPeriod(
    shopId: number,
    query?: CompetitorSaleQuery,
  ): Promise<PaginatedResponse<CompetitorSale>> {
    const {
      period_from: periodFrom,
      period_to: periodTo,
      ids,
      limit = 100,
      offset = 0,
    } = query ?? {};

    let baseQuery = this.db.selectFrom('competitor_sales').where('shop_id', '=', shopId);

    if (ids && ids.length > 0) {
      baseQuery = baseQuery.where('id', 'in', ids);
    }
    if (periodFrom) {
      baseQuery = baseQuery.where('period', '>=', periodToDate(periodFrom));
    }
    if (periodTo) {
      baseQuery = baseQuery.where('period', '<=', periodToDate(periodTo));
    }

    const { count } = await baseQuery
      .select((eb) => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow();

    const rows = await baseQuery
      .selectAll()
      .orderBy('period', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return {
      items: rows.map((r) => this.mapRow(r)),
      total: Number(count),
      limit,
      offset,
    };
  }

  async create(dto: CreateCompetitorSaleDto): Promise<CompetitorSale> {
    try {
      const result = await this.db
        .insertInto('competitor_sales')
        .values({
          shop_id: dto.shop_id,
          tenant_id: dto.tenant_id,
          competitor_product_id: dto.competitor_product_id,
          period: periodToDate(dto.period),
          quantity: dto.quantity,
          updated_at: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return this.mapRow(result);
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException(
          'Competitor sale',
          `competitor product ${dto.competitor_product_id} period ${dto.period}`,
          'this shop',
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateCompetitorSaleDto): Promise<CompetitorSale> {
    const result = await this.db
      .updateTable('competitor_sales')
      .set({ ...dto, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    if (!result) {
      throw new NotFoundException(`Competitor sale record with id ${id} not found`);
    }
    return this.mapRow(result);
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('competitor_sales').where('id', '=', id).execute();
  }

  async deleteByShopId(shopId: number): Promise<number> {
    const result = await this.db
      .deleteFrom('competitor_sales')
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  async upsert(dto: CreateCompetitorSaleDto): Promise<CompetitorSale> {
    const periodDate = periodToDate(dto.period);
    const result = await this.db
      .insertInto('competitor_sales')
      .values({
        shop_id: dto.shop_id,
        tenant_id: dto.tenant_id,
        competitor_product_id: dto.competitor_product_id,
        period: periodDate,
        quantity: dto.quantity,
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['shop_id', 'competitor_product_id', 'period']).doUpdateSet({
          quantity: dto.quantity,
          updated_at: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRow(result);
  }

  async bulkUpsert(
    tenantId: number,
    shopId: number,
    items: ImportCompetitorSaleItem[],
  ): Promise<ImportResult> {
    if (items.length === 0) {
      return { created: 0, updated: 0, errors: [] };
    }

    const errors: string[] = [];
    const validatedItems: ImportCompetitorSaleItem[] = [];

    items.forEach((item, i) => {
      const result = ImportCompetitorSaleItemSchema.safeParse(item);
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

    // Prepare competitor products lookup items
    const competitorProductItems: CompetitorProductLookupItem[] = [];
    const itemsWithMarketplaceId: Array<{
      item: ImportCompetitorSaleItem;
      marketplaceId: number;
    }> = [];

    validatedItems.forEach((item) => {
      const normalizedMarketplaceCode = this.marketplacesService.normalizeCode(item.marketplace);
      const marketplaceId = marketplaceCodeToId.get(normalizedMarketplaceCode);

      if (!marketplaceId) {
        errors.push(`Marketplace not found: ${item.marketplace}`);
        return;
      }

      competitorProductItems.push({
        marketplaceId,
        marketplaceProductId: item.marketplaceProductId,
      });
      itemsWithMarketplaceId.push({ item, marketplaceId });
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
    const validItems: PreparedCompetitorSaleItem[] = [];
    itemsWithMarketplaceId.forEach(({ item, marketplaceId }) => {
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
        competitor_product_id: competitorProductId,
        periodDate: periodToDate(item.period),
      });
    });

    if (validItems.length === 0) {
      return { created: 0, updated: 0, errors };
    }

    // Bulk upsert
    const values = validItems.map((item) => ({
      shop_id: shopId,
      tenant_id: tenantId,
      competitor_product_id: item.competitor_product_id,
      period: item.periodDate,
      quantity: item.quantity,
      updated_at: new Date(),
    }));

    await this.db
      .insertInto('competitor_sales')
      .values(values)
      .onConflict((oc) =>
        oc.columns(['shop_id', 'competitor_product_id', 'period']).doUpdateSet((eb) => ({
          quantity: eb.ref('excluded.quantity'),
          updated_at: new Date(),
        })),
      )
      .execute();

    return { created: validItems.length, updated: 0, errors };
  }

  async exportCsv(shopId: number): Promise<CompetitorSaleExportItem[]> {
    return this.exportForShop(shopId);
  }

  async exportForShop(
    shopId: number,
    periodFrom?: string,
    periodTo?: string,
  ): Promise<CompetitorSaleExportItem[]> {
    let query = this.db
      .selectFrom('competitor_sales')
      .innerJoin(
        'competitor_products',
        'competitor_products.id',
        'competitor_sales.competitor_product_id',
      )
      .innerJoin('marketplaces', 'marketplaces.id', 'competitor_products.marketplace_id')
      .select([
        'marketplaces.code as marketplace',
        'competitor_products.marketplace_product_id',
        'competitor_sales.period',
        'competitor_sales.quantity',
      ])
      .where('competitor_sales.shop_id', '=', shopId);

    if (periodFrom) {
      query = query.where('competitor_sales.period', '>=', periodToDate(periodFrom));
    }
    if (periodTo) {
      query = query.where('competitor_sales.period', '<=', periodToDate(periodTo));
    }

    const rows = await query.orderBy('competitor_sales.period', 'desc').execute();

    return rows.map((row) => ({
      marketplace: row.marketplace,
      marketplace_product_id: row.marketplace_product_id,
      period: dateToPeriod(row.period),
      quantity: row.quantity,
    }));
  }
}
