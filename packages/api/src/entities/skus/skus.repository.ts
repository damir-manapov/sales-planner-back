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
          shopId: shopId,
          tenantId: tenantId,
          updatedAt: new Date(),
        })),
      )
      .onConflict((oc) =>
        oc.columns(['code', 'shopId']).doUpdateSet((eb) => ({
          title: eb.ref('excluded.title'),
          updatedAt: new Date(),
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
          shopId: shopId,
          tenantId: tenantId,
          categoryId: item.categoryId,
          groupId: item.groupId,
          statusId: item.statusId,
          supplierId: item.supplierId,
          updatedAt: new Date(),
        })),
      )
      .onConflict((oc) =>
        oc.columns(['code', 'shopId']).doUpdateSet((eb) => ({
          title: eb.ref('excluded.title'),
          title2: eb.ref('excluded.title2'),
          categoryId: eb.ref('excluded.categoryId'),
          groupId: eb.ref('excluded.groupId'),
          statusId: eb.ref('excluded.statusId'),
          supplierId: eb.ref('excluded.supplierId'),
          updatedAt: new Date(),
        })),
      )
      .execute();
  }

  override async exportForShop(shopId: number): Promise<SkuExportItem[]> {
    const rows = await this.db
      .selectFrom('skus')
      .leftJoin('categories', 'skus.categoryId', 'categories.id')
      .leftJoin('groups', 'skus.groupId', 'groups.id')
      .leftJoin('statuses', 'skus.statusId', 'statuses.id')
      .leftJoin('suppliers', 'skus.supplierId', 'suppliers.id')
      .select([
        'skus.code',
        'skus.title',
        'skus.title2',
        'categories.code as category',
        'groups.code as group',
        'statuses.code as status',
        'suppliers.code as supplier',
      ])
      .where('skus.shopId', '=', shopId)
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
