import { Injectable } from '@nestjs/common';
import type { CreateSkuDto, Sku, UpdateSkuDto } from '@sales-planner/shared';
import { ShopScopedRepository } from '../../common/shop-scoped-repository.js';
import { DatabaseService, USER_QUERYABLE_TABLES } from '../../database/index.js';
import { isUniqueViolation } from '../../common/exceptions.js';

@Injectable()
export class SkusRepository extends ShopScopedRepository<Sku, CreateSkuDto, UpdateSkuDto> {
  constructor(db: DatabaseService) {
    super(db, 'skus', USER_QUERYABLE_TABLES);
  }

  async bulkUpsert(items: CreateSkuDto[]): Promise<void> {
    if (items.length === 0) return;

    await this.db
      .insertInto('skus')
      .values(
        items.map((item) => ({
          code: item.code,
          title: item.title,
          title2: item.title2,
          shop_id: item.shop_id,
          tenant_id: item.tenant_id,
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

  override async exportForShop(shopId: number): Promise<
    Array<{
      code: string;
      title: string;
      title2: string | null;
      category: string | null;
      group: string | null;
      status: string | null;
      supplier: string | null;
    }>
  > {
    return this.db
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
  }

  isUniqueViolation(error: unknown): boolean {
    return isUniqueViolation(error);
  }
}
