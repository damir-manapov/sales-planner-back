import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ImportResult,
  Leftover,
  LeftoverExportItem,
  PaginatedResponse,
} from '@sales-planner/shared';
import type { Selectable } from 'kysely';
import { DuplicateResourceException, isUniqueViolation } from '../../common/index.js';
import type { Leftovers as LeftoversTable } from '../../database/database.types.js';
import { DatabaseService } from '../../database/index.js';
import { dateToPeriod, periodToDate } from '../../lib/index.js';
import { SkusService } from '../skus/skus.service.js';
import { WarehousesService } from '../warehouses/warehouses.service.js';
import type {
  CreateLeftoverDto,
  ImportLeftoverItem,
  LeftoverQuery,
  UpdateLeftoverDto,
} from './leftovers.schema.js';
import { ImportLeftoverItemSchema } from './leftovers.schema.js';

export type { Leftover };

type LeftoverRow = Selectable<LeftoversTable>;

interface PreparedLeftoverItem extends ImportLeftoverItem {
  sku_id: number;
  warehouse_id: number;
  periodDate: Date;
}

@Injectable()
export class LeftoversService {
  constructor(
    private readonly db: DatabaseService,
    private readonly skusService: SkusService,
    private readonly warehousesService: WarehousesService,
  ) {}

  private mapRow(row: LeftoverRow): Leftover {
    return {
      ...row,
      period: dateToPeriod(row.period),
    };
  }

  async findAll(): Promise<Leftover[]> {
    const rows = await this.db.selectFrom('leftovers').selectAll().execute();
    return rows.map((r) => this.mapRow(r));
  }

  async findById(id: number): Promise<Leftover | undefined> {
    const row = await this.db
      .selectFrom('leftovers')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? this.mapRow(row) : undefined;
  }

  async findByShopId(shopId: number): Promise<Leftover[]> {
    const rows = await this.db
      .selectFrom('leftovers')
      .selectAll()
      .where('shop_id', '=', shopId)
      .execute();
    return rows.map((r) => this.mapRow(r));
  }

  async findByShopAndPeriod(
    shopId: number,
    query?: LeftoverQuery,
  ): Promise<PaginatedResponse<Leftover>> {
    const {
      period_from: periodFrom,
      period_to: periodTo,
      ids,
      limit = 100,
      offset = 0,
    } = query ?? {};

    let baseQuery = this.db.selectFrom('leftovers').where('shop_id', '=', shopId);

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

  async create(dto: CreateLeftoverDto): Promise<Leftover> {
    try {
      const result = await this.db
        .insertInto('leftovers')
        .values({
          shop_id: dto.shop_id,
          tenant_id: dto.tenant_id,
          warehouse_id: dto.warehouse_id,
          sku_id: dto.sku_id,
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
          'Leftover',
          `SKU ${dto.sku_id} warehouse ${dto.warehouse_id} period ${dto.period}`,
          'this shop',
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateLeftoverDto): Promise<Leftover> {
    const result = await this.db
      .updateTable('leftovers')
      .set({ ...dto, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    if (!result) {
      throw new NotFoundException(`Leftover record with id ${id} not found`);
    }
    return this.mapRow(result);
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('leftovers').where('id', '=', id).execute();
  }

  async deleteByShopId(shopId: number): Promise<number> {
    const result = await this.db
      .deleteFrom('leftovers')
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  async upsert(dto: CreateLeftoverDto): Promise<Leftover> {
    const periodDate = periodToDate(dto.period);
    const result = await this.db
      .insertInto('leftovers')
      .values({
        shop_id: dto.shop_id,
        tenant_id: dto.tenant_id,
        warehouse_id: dto.warehouse_id,
        sku_id: dto.sku_id,
        period: periodDate,
        quantity: dto.quantity,
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['shop_id', 'warehouse_id', 'sku_id', 'period']).doUpdateSet({
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
    items: ImportLeftoverItem[],
  ): Promise<ImportResult> {
    if (items.length === 0) {
      return { created: 0, updated: 0, errors: [] };
    }

    const errors: string[] = [];
    const validatedItems: ImportLeftoverItem[] = [];

    items.forEach((item, i) => {
      const result = ImportLeftoverItemSchema.safeParse(item);
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

    // Find or create warehouses by code
    const warehouseCodes = validatedItems.map((i) =>
      this.warehousesService.normalizeCode(i.warehouse),
    );
    const { codeToId: warehouseCodeToId } = await this.warehousesService.findOrCreateByCode(
      tenantId,
      shopId,
      warehouseCodes,
    );

    // Prepare items
    const validItems: PreparedLeftoverItem[] = [];
    validatedItems.forEach((item) => {
      const normalizedSkuCode = this.skusService.normalizeCode(item.sku);
      const normalizedWarehouse = this.warehousesService.normalizeCode(item.warehouse);
      const skuId = skuCodeToId.get(normalizedSkuCode);
      const warehouseId = warehouseCodeToId.get(normalizedWarehouse);

      if (!skuId) {
        errors.push(`SKU not found: ${item.sku}`);
        return;
      }
      if (!warehouseId) {
        errors.push(`Warehouse not found: ${item.warehouse}`);
        return;
      }

      validItems.push({
        ...item,
        sku_id: skuId,
        warehouse_id: warehouseId,
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
      sku_id: item.sku_id,
      warehouse_id: item.warehouse_id,
      period: item.periodDate,
      quantity: item.quantity,
      updated_at: new Date(),
    }));

    await this.db
      .insertInto('leftovers')
      .values(values)
      .onConflict((oc) =>
        oc.columns(['shop_id', 'warehouse_id', 'sku_id', 'period']).doUpdateSet((eb) => ({
          quantity: eb.ref('excluded.quantity'),
          updated_at: new Date(),
        })),
      )
      .execute();

    return { created: validItems.length, updated: 0, errors };
  }

  async exportCsv(shopId: number): Promise<LeftoverExportItem[]> {
    return this.exportForShop(shopId);
  }

  async exportForShop(
    shopId: number,
    periodFrom?: string,
    periodTo?: string,
  ): Promise<LeftoverExportItem[]> {
    let query = this.db
      .selectFrom('leftovers')
      .innerJoin('skus', 'skus.id', 'leftovers.sku_id')
      .innerJoin('warehouses', 'warehouses.id', 'leftovers.warehouse_id')
      .select([
        'warehouses.code as warehouse',
        'skus.code as sku',
        'leftovers.period',
        'leftovers.quantity',
      ])
      .where('leftovers.shop_id', '=', shopId);

    if (periodFrom) {
      query = query.where('leftovers.period', '>=', periodToDate(periodFrom));
    }
    if (periodTo) {
      query = query.where('leftovers.period', '<=', periodToDate(periodTo));
    }

    const rows = await query.orderBy('leftovers.period', 'desc').execute();

    return rows.map((row) => ({
      warehouse: row.warehouse,
      sku: row.sku,
      period: dateToPeriod(row.period),
      quantity: row.quantity,
    }));
  }
}
