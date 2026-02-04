import { Injectable } from '@nestjs/common';
import type { Selectable } from 'kysely';
import { sql } from 'kysely';
import type { SalesHistory, SalesHistoryExportItem } from '@sales-planner/shared';
import { DuplicateResourceException, isUniqueViolation } from '../common/index.js';
import type { SalesHistory as SalesHistoryTable } from '../database/database.types.js';
import { DatabaseService } from '../database/index.js';
import {
  dateToPeriod,
  isValidPeriod,
  periodToDate,
  normalizeCode,
  normalizeSkuCode,
} from '../lib/index.js';
import { MarketplacesService } from '../marketplaces/marketplaces.service.js';
import { SkusService } from '../skus/skus.service.js';
import type {
  CreateSalesHistoryDto,
  ImportSalesHistoryItem,
  UpdateSalesHistoryDto,
} from './sales-history.schema.js';

export type { SalesHistory };

type SalesHistoryRow = Selectable<SalesHistoryTable>;

interface PreparedSalesHistoryItem extends ImportSalesHistoryItem {
  sku_id: number;
  periodDate: Date;
  marketplace_id: string;
}

@Injectable()
export class SalesHistoryService {
  constructor(
    private readonly db: DatabaseService,
    private readonly skusService: SkusService,
    private readonly marketplacesService: MarketplacesService,
  ) {}

  private mapRow(row: SalesHistoryRow): SalesHistory {
    return {
      ...row,
      period: dateToPeriod(row.period),
    };
  }

  async findAll(): Promise<SalesHistory[]> {
    const rows = await this.db.selectFrom('sales_history').selectAll().execute();
    return rows.map((r) => this.mapRow(r));
  }

  async findById(id: number): Promise<SalesHistory | undefined> {
    const row = await this.db
      .selectFrom('sales_history')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? this.mapRow(row) : undefined;
  }

  async findByShopId(shopId: number): Promise<SalesHistory[]> {
    const rows = await this.db
      .selectFrom('sales_history')
      .selectAll()
      .where('shop_id', '=', shopId)
      .execute();
    return rows.map((r) => this.mapRow(r));
  }

  async findByShopAndPeriod(
    shopId: number,
    periodFrom?: string,
    periodTo?: string,
  ): Promise<SalesHistory[]> {
    let query = this.db.selectFrom('sales_history').selectAll().where('shop_id', '=', shopId);

    if (periodFrom) {
      query = query.where('period', '>=', periodToDate(periodFrom));
    }
    if (periodTo) {
      query = query.where('period', '<=', periodToDate(periodTo));
    }

    const rows = await query.orderBy('period', 'desc').execute();
    return rows.map((r) => this.mapRow(r));
  }

  async findBySkuId(skuId: number): Promise<SalesHistory[]> {
    const rows = await this.db
      .selectFrom('sales_history')
      .selectAll()
      .where('sku_id', '=', skuId)
      .orderBy('period', 'desc')
      .execute();
    return rows.map((r) => this.mapRow(r));
  }

  async create(dto: CreateSalesHistoryDto): Promise<SalesHistory> {
    try {
      const result = await this.db
        .insertInto('sales_history')
        .values({
          shop_id: dto.shop_id,
          tenant_id: dto.tenant_id,
          sku_id: dto.sku_id,
          period: periodToDate(dto.period),
          quantity: dto.quantity,
          marketplace_id: dto.marketplace_id,
          updated_at: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return this.mapRow(result);
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException(
          'Sales History',
          `SKU ${dto.sku_id} for period ${dto.period}`,
          'this shop',
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateSalesHistoryDto): Promise<SalesHistory | undefined> {
    const result = await this.db
      .updateTable('sales_history')
      .set({ ...dto, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    return result ? this.mapRow(result) : undefined;
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('sales_history').where('id', '=', id).execute();
  }

  async deleteByShopId(shopId: number): Promise<number> {
    const result = await this.db
      .deleteFrom('sales_history')
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  async upsert(dto: CreateSalesHistoryDto): Promise<SalesHistory> {
    const periodDate = periodToDate(dto.period);
    const result = await this.db
      .insertInto('sales_history')
      .values({
        shop_id: dto.shop_id,
        tenant_id: dto.tenant_id,
        sku_id: dto.sku_id,
        period: periodDate,
        quantity: dto.quantity,
        marketplace_id: dto.marketplace_id,
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['shop_id', 'sku_id', 'period', 'marketplace_id']).doUpdateSet({
          quantity: dto.quantity,
          updated_at: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRow(result);
  }

  async bulkUpsert(
    items: ImportSalesHistoryItem[],
    shopId: number,
    tenantId: number,
  ): Promise<{
    created: number;
    updated: number;
    skus_created: number;
    marketplaces_created: number;
    errors: string[];
  }> {
    if (items.length === 0) {
      return { created: 0, updated: 0, skus_created: 0, marketplaces_created: 0, errors: [] };
    }

    const errors: string[] = [];

    // Validate items first
    const validatedItems: ImportSalesHistoryItem[] = [];

    items.forEach((item, i) => {
      if (!item.sku_code || !item.period) {
        errors.push(`Invalid item at index ${i}: sku_code and period are required`);
        return;
      }
      if (!item.marketplace) {
        errors.push(`Invalid item at index ${i}: marketplace is required`);
        return;
      }
      if (!isValidPeriod(item.period)) {
        errors.push(
          `Invalid item at index ${i}: period must be in YYYY-MM format with valid month`,
        );
        return;
      }
      validatedItems.push(item);
    });

    if (validatedItems.length === 0) {
      return { created: 0, updated: 0, skus_created: 0, marketplaces_created: 0, errors };
    }

    // Find or create SKUs by code
    const skuCodes = validatedItems.map((i) => normalizeSkuCode(i.sku_code));
    const { codeToId: skuCodeToId, created: skusCreated } =
      await this.skusService.findOrCreateByCode(skuCodes, shopId, tenantId);

    // Ensure all marketplaces exist (auto-creates missing ones)
    const marketplaceIds = validatedItems.map((i) => normalizeCode(i.marketplace));
    const marketplacesCreated = await this.marketplacesService.ensureExist(
      marketplaceIds,
      shopId,
      tenantId,
    );

    // Map items to include sku_id
    const validItems: PreparedSalesHistoryItem[] = [];

    validatedItems.forEach((item) => {
      const normalizedSkuCode = normalizeSkuCode(item.sku_code);
      const skuId = skuCodeToId.get(normalizedSkuCode);
      if (skuId) {
        validItems.push({
          ...item,
          sku_id: skuId,
          periodDate: periodToDate(item.period),
          marketplace_id: normalizeCode(item.marketplace),
        });
      }
    });

    if (validItems.length === 0) {
      return {
        created: 0,
        updated: 0,
        skus_created: skusCreated,
        marketplaces_created: marketplacesCreated,
        errors,
      };
    }

    // Get existing records for counting
    const existingKeys = new Set(
      (
        await this.db
          .selectFrom('sales_history')
          .select([
            'sku_id',
            sql<string>`to_char(period, 'YYYY-MM')`.as('period_str'),
            'marketplace_id',
          ])
          .where('shop_id', '=', shopId)
          .where(
            'sku_id',
            'in',
            validItems.map((i) => i.sku_id),
          )
          .execute()
      ).map((r) => `${r.sku_id}-${r.period_str}-${r.marketplace_id}`),
    );

    // Use ON CONFLICT for efficient upsert (all items have marketplace since it's required)
    await this.db
      .insertInto('sales_history')
      .values(
        validItems.map((item) => ({
          shop_id: shopId,
          tenant_id: tenantId,
          sku_id: item.sku_id,
          period: item.periodDate,
          quantity: item.quantity,
          marketplace_id: item.marketplace_id,
          updated_at: new Date(),
        })),
      )
      .onConflict((oc) =>
        oc.columns(['shop_id', 'sku_id', 'period', 'marketplace_id']).doUpdateSet({
          quantity: (eb) => eb.ref('excluded.quantity'),
          updated_at: new Date(),
        }),
      )
      .execute();

    const created = validItems.filter(
      (i) => !existingKeys.has(`${i.sku_id}-${i.period}-${i.marketplace_id}`),
    ).length;
    const updated = validItems.filter((i) =>
      existingKeys.has(`${i.sku_id}-${i.period}-${i.marketplace_id}`),
    ).length;

    return {
      created,
      updated,
      skus_created: skusCreated,
      marketplaces_created: marketplacesCreated,
      errors,
    };
  }

  async exportForShop(
    shopId: number,
    periodFrom?: string,
    periodTo?: string,
  ): Promise<SalesHistoryExportItem[]> {
    let query = this.db
      .selectFrom('sales_history')
      .innerJoin('skus', 'skus.id', 'sales_history.sku_id')
      .select([
        'skus.code as sku_code',
        sql<string>`to_char(sales_history.period, 'YYYY-MM')`.as('period'),
        'sales_history.quantity',
        'sales_history.marketplace_id',
      ])
      .where('sales_history.shop_id', '=', shopId);

    if (periodFrom) {
      query = query.where('sales_history.period', '>=', periodToDate(periodFrom));
    }
    if (periodTo) {
      query = query.where('sales_history.period', '<=', periodToDate(periodTo));
    }

    const rows = await query
      .orderBy('skus.code', 'asc')
      .orderBy('sales_history.period', 'asc')
      .execute();

    return rows.map((r) => ({
      sku_code: r.sku_code,
      period: r.period,
      quantity: r.quantity,
      marketplace: r.marketplace_id,
    }));
  }
}
