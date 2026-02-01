import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/index.js';
import { sql } from 'kysely';
import { periodToDate, dateToPeriod, isValidPeriod } from '../lib/index.js';
import type {
  CreateSalesHistoryDto,
  UpdateSalesHistoryDto,
  ImportSalesHistoryItem,
} from './sales-history.schema.js';

export interface SalesHistory {
  id: number;
  shop_id: number;
  tenant_id: number;
  sku_id: number;
  period: string; // "YYYY-MM" format
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class SalesHistoryService {
  constructor(private readonly db: DatabaseService) {}

  private mapRow(row: {
    id: number;
    shop_id: number;
    tenant_id: number;
    sku_id: number;
    period: Date;
    quantity: number;
    created_at: Date;
    updated_at: Date;
  }): SalesHistory {
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
    const result = await this.db
      .insertInto('sales_history')
      .values({
        shop_id: dto.shop_id,
        tenant_id: dto.tenant_id,
        sku_id: dto.sku_id,
        period: periodToDate(dto.period),
        quantity: dto.quantity,
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRow(result);
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
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['shop_id', 'sku_id', 'period']).doUpdateSet({
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
  ): Promise<{ created: number; updated: number; skus_created: number; errors: string[] }> {
    if (items.length === 0) {
      return { created: 0, updated: 0, skus_created: 0, errors: [] };
    }

    const errors: string[] = [];

    // Validate items first
    const validatedItems: Array<{
      sku_code: string;
      period: string;
      quantity: number;
    }> = [];

    items.forEach((item, i) => {
      if (!item.sku_code || !item.period) {
        errors.push(`Invalid item at index ${i}: sku_code and period are required`);
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
      return { created: 0, updated: 0, skus_created: 0, errors };
    }

    // Resolve SKU codes to IDs
    const skuCodes = [...new Set(validatedItems.map((i) => i.sku_code))];
    let skus = await this.db
      .selectFrom('skus')
      .select(['id', 'code'])
      .where('shop_id', '=', shopId)
      .where('code', 'in', skuCodes)
      .execute();

    // Auto-create missing SKUs
    const existingCodes = new Set(skus.map((s) => s.code));
    const missingCodes = skuCodes.filter((code) => !existingCodes.has(code));

    if (missingCodes.length > 0) {
      const newSkus = await this.db
        .insertInto('skus')
        .values(
          missingCodes.map((code) => ({
            code,
            title: code, // Use code as title for auto-created SKUs
            shop_id: shopId,
            tenant_id: tenantId,
            updated_at: new Date(),
          })),
        )
        .returning(['id', 'code'])
        .execute();

      skus = [...skus, ...newSkus];
    }

    const skusCreated = missingCodes.length;
    const skuCodeToId = new Map(skus.map((s) => [s.code, s.id]));

    // Map items to include sku_id
    const validItems: Array<{
      sku_id: number;
      sku_code: string;
      period: string;
      periodDate: Date;
      quantity: number;
    }> = [];

    validatedItems.forEach((item) => {
      const skuId = skuCodeToId.get(item.sku_code);
      if (skuId) {
        validItems.push({
          ...item,
          sku_id: skuId,
          periodDate: periodToDate(item.period),
        });
      }
    });

    if (validItems.length === 0) {
      return { created: 0, updated: 0, skus_created: skusCreated, errors };
    }

    // Get existing records for counting
    const existingKeys = new Set(
      (
        await this.db
          .selectFrom('sales_history')
          .select(['sku_id', sql<string>`to_char(period, 'YYYY-MM')`.as('period_str')])
          .where('shop_id', '=', shopId)
          .where(
            'sku_id',
            'in',
            validItems.map((i) => i.sku_id),
          )
          .execute()
      ).map((r) => `${r.sku_id}-${r.period_str}`),
    );

    // Use ON CONFLICT for efficient upsert
    await this.db
      .insertInto('sales_history')
      .values(
        validItems.map((item) => ({
          shop_id: shopId,
          tenant_id: tenantId,
          sku_id: item.sku_id,
          period: item.periodDate,
          quantity: item.quantity,
          updated_at: new Date(),
        })),
      )
      .onConflict((oc) =>
        oc.columns(['shop_id', 'sku_id', 'period']).doUpdateSet({
          quantity: (eb) => eb.ref('excluded.quantity'),
          updated_at: new Date(),
        }),
      )
      .execute();

    const created = validItems.filter((i) => !existingKeys.has(`${i.sku_id}-${i.period}`)).length;
    const updated = validItems.filter((i) => existingKeys.has(`${i.sku_id}-${i.period}`)).length;

    return { created, updated, skus_created: skusCreated, errors };
  }

  async exportForShop(
    shopId: number,
    periodFrom?: string,
    periodTo?: string,
  ): Promise<Array<{ sku_code: string; period: string; quantity: number }>> {
    let query = this.db
      .selectFrom('sales_history')
      .innerJoin('skus', 'skus.id', 'sales_history.sku_id')
      .select([
        'skus.code as sku_code',
        sql<string>`to_char(sales_history.period, 'YYYY-MM')`.as('period'),
        'sales_history.quantity',
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

    return rows;
  }
}
