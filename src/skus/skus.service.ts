import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/index.js';

export interface CreateSkuDto {
  code: string;
  title: string;
  shop_id: number;
  tenant_id: number;
}

export interface UpdateSkuDto {
  code?: string;
  title?: string;
  // Note: shop_id and tenant_id are intentionally not updatable
  // Once a SKU is created in a shop/tenant, it stays there
}

export interface Sku {
  id: number;
  code: string;
  title: string;
  shop_id: number;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class SkusService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Sku[]> {
    return this.db.selectFrom('skus').selectAll().execute();
  }

  async findById(id: number): Promise<Sku | undefined> {
    return this.db.selectFrom('skus').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async findByShopId(shopId: number): Promise<Sku[]> {
    return this.db.selectFrom('skus').selectAll().where('shop_id', '=', shopId).execute();
  }

  async findByTenantId(tenantId: number): Promise<Sku[]> {
    return this.db.selectFrom('skus').selectAll().where('tenant_id', '=', tenantId).execute();
  }

  async findByCodeAndShop(code: string, shopId: number): Promise<Sku | undefined> {
    return this.db
      .selectFrom('skus')
      .selectAll()
      .where('code', '=', code)
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
  }

  async create(dto: CreateSkuDto): Promise<Sku> {
    const result = await this.db
      .insertInto('skus')
      .values({
        code: dto.code,
        title: dto.title,
        shop_id: dto.shop_id,
        tenant_id: dto.tenant_id,
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  async update(id: number, dto: UpdateSkuDto): Promise<Sku | undefined> {
    return this.db
      .updateTable('skus')
      .set({ ...dto, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('skus').where('id', '=', id).execute();
  }

  async bulkUpsert(
    items: Array<{ code: string; title: string }>,
    shopId: number,
    tenantId: number,
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    if (items.length === 0) {
      return { created: 0, updated: 0, errors: [] };
    }

    const errors: string[] = [];
    const validItems: Array<{ code: string; title: string }> = [];

    items.forEach((item, i) => {
      if (!item.code || !item.title) {
        const identifier = item.code || `index ${i}`;
        errors.push(`Invalid item "${identifier}": code and title are required`);
        return;
      }
      validItems.push(item);
    });

    if (validItems.length === 0) {
      return { created: 0, updated: 0, errors };
    }

    // Get existing SKUs for this shop in one query
    const existingCodes = new Set(
      (
        await this.db
          .selectFrom('skus')
          .select('code')
          .where('shop_id', '=', shopId)
          .where(
            'code',
            'in',
            validItems.map((i) => i.code),
          )
          .execute()
      ).map((r) => r.code),
    );

    // Use ON CONFLICT for efficient upsert
    await this.db
      .insertInto('skus')
      .values(
        validItems.map((item) => ({
          code: item.code,
          title: item.title,
          shop_id: shopId,
          tenant_id: tenantId,
          updated_at: new Date(),
        })),
      )
      .onConflict((oc) =>
        oc.columns(['code', 'shop_id']).doUpdateSet({
          title: (eb) => eb.ref('excluded.title'),
          updated_at: new Date(),
        }),
      )
      .execute();

    const created = validItems.filter((i) => !existingCodes.has(i.code)).length;
    const updated = validItems.filter((i) => existingCodes.has(i.code)).length;

    return { created, updated, errors };
  }
}
