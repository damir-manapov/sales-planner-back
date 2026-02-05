import { Injectable } from '@nestjs/common';
import type { Sku, SkuExportItem } from '@sales-planner/shared';
import { BaseEntityService } from '../common/index.js';
import { DatabaseService } from '../database/index.js';
import { normalizeSkuCode } from '../lib/index.js';
import type { CreateSkuDto, ImportSkuItem, UpdateSkuDto } from './skus.schema.js';
import { ImportSkuItemSchema } from './skus.schema.js';

export type { Sku };

@Injectable()
export class SkusService extends BaseEntityService<Sku, CreateSkuDto, UpdateSkuDto, ImportSkuItem> {
  constructor(db: DatabaseService) {
    super(db, 'skus');
  }

  protected normalizeCode(code: string): string {
    return normalizeSkuCode(code);
  }

  protected validateImportItem(item: unknown) {
    return ImportSkuItemSchema.safeParse(item);
  }

  async deleteByShopId(shopId: number): Promise<number> {
    const result = await this.db
      .deleteFrom('skus')
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  async exportForShop(shopId: number): Promise<SkuExportItem[]> {
    const skus = await this.db
      .selectFrom('skus')
      .select(['code', 'title'])
      .where('shop_id', '=', shopId)
      .orderBy('code', 'asc')
      .execute();

    return skus;
  }
}
