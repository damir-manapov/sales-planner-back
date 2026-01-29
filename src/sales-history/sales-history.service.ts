import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/index.js';
import { sql } from 'kysely';

export interface CreateSalesHistoryDto {
  shop_id: number;
  tenant_id: number;
  sku_id: number;
  period: string; // "YYYY-MM" format, stored as first of month
  quantity: number;
  amount: string; // decimal as string
}

export interface UpdateSalesHistoryDto {
  quantity?: number;
  amount?: string;
  // Note: shop_id, tenant_id, sku_id, period are not updatable
}

export interface SalesHistory {
  id: number;
  shop_id: number;
  tenant_id: number;
  sku_id: number;
  period: string; // "YYYY-MM" format
  quantity: number;
  amount: string;
  created_at: Date;
  updated_at: Date;
}

// Convert "YYYY-MM" to Date (first of month)
function periodToDate(period: string): Date {
  const parts = period.split('-').map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  return new Date(Date.UTC(year, month - 1, 1));
}

// Convert Date to "YYYY-MM"
function dateToPeriod(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Validate period format "YYYY-MM"
function isValidPeriod(period: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(period)) return false;
  const parts = period.split('-').map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 0;
  return month >= 1 && month <= 12 && year >= 1900 && year <= 9999;
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
    amount: string;
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
        amount: dto.amount,
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
        amount: dto.amount,
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['shop_id', 'sku_id', 'period']).doUpdateSet({
          quantity: dto.quantity,
          amount: dto.amount,
          updated_at: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRow(result);
  }

  async bulkUpsert(
    items: Array<{ sku_id: number; period: string; quantity: number; amount: string }>,
    shopId: number,
    tenantId: number,
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    if (items.length === 0) {
      return { created: 0, updated: 0, errors: [] };
    }

    const errors: string[] = [];
    const validItems: Array<{
      sku_id: number;
      period: string;
      periodDate: Date;
      quantity: number;
      amount: string;
    }> = [];

    items.forEach((item, i) => {
      if (!item.sku_id || !item.period) {
        errors.push(`Invalid item at index ${i}: sku_id and period are required`);
        return;
      }
      if (!isValidPeriod(item.period)) {
        errors.push(
          `Invalid item at index ${i}: period must be in YYYY-MM format with valid month`,
        );
        return;
      }
      validItems.push({
        ...item,
        periodDate: periodToDate(item.period),
      });
    });

    if (validItems.length === 0) {
      return { created: 0, updated: 0, errors };
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
          amount: item.amount,
          updated_at: new Date(),
        })),
      )
      .onConflict((oc) =>
        oc.columns(['shop_id', 'sku_id', 'period']).doUpdateSet({
          quantity: (eb) => eb.ref('excluded.quantity'),
          amount: (eb) => eb.ref('excluded.amount'),
          updated_at: new Date(),
        }),
      )
      .execute();

    const created = validItems.filter((i) => !existingKeys.has(`${i.sku_id}-${i.period}`)).length;
    const updated = validItems.filter((i) => existingKeys.has(`${i.sku_id}-${i.period}`)).length;

    return { created, updated, errors };
  }
}

export { isValidPeriod };
