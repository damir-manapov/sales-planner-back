import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/index.js';

export interface CreateSalesHistoryDto {
  shop_id: number;
  tenant_id: number;
  sku_id: number;
  year: number;
  month: number;
  quantity: number;
  amount: string; // decimal as string
}

export interface UpdateSalesHistoryDto {
  quantity?: number;
  amount?: string;
  // Note: shop_id, tenant_id, sku_id, year, month are not updatable
}

export interface SalesHistory {
  id: number;
  shop_id: number;
  tenant_id: number;
  sku_id: number;
  year: number;
  month: number;
  quantity: number;
  amount: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class SalesHistoryService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<SalesHistory[]> {
    return this.db.selectFrom('sales_history').selectAll().execute();
  }

  async findById(id: number): Promise<SalesHistory | undefined> {
    return this.db.selectFrom('sales_history').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async findByShopId(shopId: number): Promise<SalesHistory[]> {
    return this.db.selectFrom('sales_history').selectAll().where('shop_id', '=', shopId).execute();
  }

  async findByShopAndPeriod(
    shopId: number,
    year?: number,
    month?: number,
  ): Promise<SalesHistory[]> {
    let query = this.db.selectFrom('sales_history').selectAll().where('shop_id', '=', shopId);

    if (year !== undefined) {
      query = query.where('year', '=', year);
    }
    if (month !== undefined) {
      query = query.where('month', '=', month);
    }

    return query.orderBy('year', 'desc').orderBy('month', 'desc').execute();
  }

  async findBySkuId(skuId: number): Promise<SalesHistory[]> {
    return this.db
      .selectFrom('sales_history')
      .selectAll()
      .where('sku_id', '=', skuId)
      .orderBy('year', 'desc')
      .orderBy('month', 'desc')
      .execute();
  }

  async create(dto: CreateSalesHistoryDto): Promise<SalesHistory> {
    const result = await this.db
      .insertInto('sales_history')
      .values({
        shop_id: dto.shop_id,
        tenant_id: dto.tenant_id,
        sku_id: dto.sku_id,
        year: dto.year,
        month: dto.month,
        quantity: dto.quantity,
        amount: dto.amount,
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  async update(id: number, dto: UpdateSalesHistoryDto): Promise<SalesHistory | undefined> {
    return this.db
      .updateTable('sales_history')
      .set({ ...dto, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('sales_history').where('id', '=', id).execute();
  }

  async upsert(dto: CreateSalesHistoryDto): Promise<SalesHistory> {
    const result = await this.db
      .insertInto('sales_history')
      .values({
        shop_id: dto.shop_id,
        tenant_id: dto.tenant_id,
        sku_id: dto.sku_id,
        year: dto.year,
        month: dto.month,
        quantity: dto.quantity,
        amount: dto.amount,
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['shop_id', 'sku_id', 'year', 'month']).doUpdateSet({
          quantity: dto.quantity,
          amount: dto.amount,
          updated_at: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  async bulkUpsert(
    items: Array<{ sku_id: number; year: number; month: number; quantity: number; amount: string }>,
    shopId: number,
    tenantId: number,
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    if (items.length === 0) {
      return { created: 0, updated: 0, errors: [] };
    }

    const errors: string[] = [];
    const validItems: Array<{
      sku_id: number;
      year: number;
      month: number;
      quantity: number;
      amount: string;
    }> = [];

    items.forEach((item, i) => {
      if (!item.sku_id || !item.year || !item.month) {
        errors.push(`Invalid item at index ${i}: sku_id, year, and month are required`);
        return;
      }
      if (item.month < 1 || item.month > 12) {
        errors.push(`Invalid item at index ${i}: month must be between 1 and 12`);
        return;
      }
      validItems.push(item);
    });

    if (validItems.length === 0) {
      return { created: 0, updated: 0, errors };
    }

    // Get existing records for counting
    const existingKeys = new Set(
      (
        await this.db
          .selectFrom('sales_history')
          .select(['sku_id', 'year', 'month'])
          .where('shop_id', '=', shopId)
          .where(
            'sku_id',
            'in',
            validItems.map((i) => i.sku_id),
          )
          .execute()
      ).map((r) => `${r.sku_id}-${r.year}-${r.month}`),
    );

    // Use ON CONFLICT for efficient upsert
    await this.db
      .insertInto('sales_history')
      .values(
        validItems.map((item) => ({
          shop_id: shopId,
          tenant_id: tenantId,
          sku_id: item.sku_id,
          year: item.year,
          month: item.month,
          quantity: item.quantity,
          amount: item.amount,
          updated_at: new Date(),
        })),
      )
      .onConflict((oc) =>
        oc.columns(['shop_id', 'sku_id', 'year', 'month']).doUpdateSet({
          quantity: (eb) => eb.ref('excluded.quantity'),
          amount: (eb) => eb.ref('excluded.amount'),
          updated_at: new Date(),
        }),
      )
      .execute();

    const created = validItems.filter(
      (i) => !existingKeys.has(`${i.sku_id}-${i.year}-${i.month}`),
    ).length;
    const updated = validItems.filter((i) =>
      existingKeys.has(`${i.sku_id}-${i.year}-${i.month}`),
    ).length;

    return { created, updated, errors };
  }
}
