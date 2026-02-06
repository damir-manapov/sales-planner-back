import { Injectable } from '@nestjs/common';
import type {
  CodedTitledItem,
  CreateSkuDto,
  CreateSkuRequest,
  Sku,
  SkuExportItem,
  UpdateSkuDto,
} from '@sales-planner/shared';
import type { BulkUpsertResult } from '../../common/internal-types.js';
import { CodedShopScopedRepository } from '../../common/index.js';
import { DatabaseService, USER_QUERYABLE_TABLES } from '../../database/index.js';

@Injectable()
export class SkusRepository extends CodedShopScopedRepository<
  Sku,
  CreateSkuDto,
  UpdateSkuDto,
  SkuExportItem,
  CodedTitledItem
> {
  constructor(db: DatabaseService) {
    super(db, 'skus', USER_QUERYABLE_TABLES);
  }

  override async bulkUpsert(
    tenantId: number,
    shopId: number,
    items: CodedTitledItem[],
  ): Promise<BulkUpsertResult> {
    if (items.length === 0) {
      return { created: 0, updated: 0 };
    }

    const existingCodes = await this.findCodesByShopId(
      shopId,
      items.map((i) => i.code),
    );

    const updated = items.filter((i) => existingCodes.has(i.code)).length;
    const created = items.length - updated;

    await this.db
      .insertInto('skus')
      .values(
        items.map((item) => ({
          code: item.code,
          title: item.title,
          shop_id: shopId,
          tenant_id: tenantId,
          updated_at: new Date(),
        })),
      )
      .onConflict((oc) =>
        oc.columns(['code', 'shop_id']).doUpdateSet((eb) => ({
          title: eb.ref('excluded.title'),
          updated_at: new Date(),
        })),
      )
      .execute();

    return { created, updated };
  }

  /**
   * Bulk upsert with full SKU fields (used by import)
   */
  async bulkUpsertFull(tenantId: number, shopId: number, items: CreateSkuRequest[]): Promise<void> {
    if (items.length === 0) return;

    await this.db
      .insertInto('skus')
      .values(
        items.map((item) => ({
          code: item.code,
          title: item.title,
          title2: item.title2,
          shop_id: shopId,
          tenant_id: tenantId,
          category_id: item.category_id,
          group_id: item.group_id,
          status_id: item.status_id,
          supplier_id: item.supplier_id,
          updated_at: new Date(),
        })),
      )
      .onConflict((oc) =>
        oc.columns(['code', 'shop_id']).doUpdateSet((eb) => ({
          title: eb.ref('excluded.title'),
          title2: eb.ref('excluded.title2'),
          category_id: eb.ref('excluded.category_id'),
          group_id: eb.ref('excluded.group_id'),
          status_id: eb.ref('excluded.status_id'),
          supplier_id: eb.ref('excluded.supplier_id'),
          updated_at: new Date(),
        })),
      )
      .execute();
  }

  override async exportForShop(shopId: number): Promise<SkuExportItem[]> {
    const rows = await this.db
      .selectFrom('skus')
      .leftJoin('categories', 'skus.category_id', 'categories.id')
      .leftJoin('groups', 'skus.group_id', 'groups.id')
      .leftJoin('statuses', 'skus.status_id', 'statuses.id')
      .leftJoin('suppliers', 'skus.supplier_id', 'suppliers.id')
      .select([
        'skus.code',
        'skus.title',
        'skus.title2',
        'categories.code as category',
        'groups.code as group',
        'statuses.code as status',
        'suppliers.code as supplier',
      ])
      .where('skus.shop_id', '=', shopId)
      .orderBy('skus.code', 'asc')
      .execute();

    return rows.map((row) => ({
      code: row.code,
      title: row.title,
      title2: row.title2 ?? undefined,
      category: row.category ?? undefined,
      group: row.group ?? undefined,
      status: row.status ?? undefined,
      supplier: row.supplier ?? undefined,
    }));
  }
}
