import { Injectable } from '@nestjs/common';
import type { Sku, SkuExportItem } from '@sales-planner/shared';
import { DuplicateResourceException, isUniqueViolation } from '../common/index.js';
import { DatabaseService } from '../database/index.js';
import { normalizeSkuCode } from '../lib/index.js';
import type { CreateSkuDto, ImportSkuItem, UpdateSkuDto } from './skus.schema.js';

export type { Sku };

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
    try {
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
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException('SKU', dto.code, 'this shop');
      }
      throw error;
    }
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

  async deleteByShopId(shopId: number): Promise<number> {
    const result = await this.db
      .deleteFrom('skus')
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  async bulkUpsert(
    items: ImportSkuItem[],
    shopId: number,
    tenantId: number,
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    if (items.length === 0) {
      return { created: 0, updated: 0, errors: [] };
    }

    const errors: string[] = [];
    const validItems: ImportSkuItem[] = [];

    items.forEach((item, i) => {
      if (!item.code || !item.title) {
        const identifier = item.code || `index ${i}`;
        errors.push(`Invalid item "${identifier}": code and title are required`);
        return;
      }

      // Normalize the SKU code
      const normalizedCode = normalizeSkuCode(item.code);
      validItems.push({
        ...item,
        code: normalizedCode,
      });
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

  /**
   * Finds SKUs by code or creates missing ones.
   * Returns a map of code -> id and the count of newly created SKUs.
   */
  async findOrCreateByCode(
    codes: string[],
    shopId: number,
    tenantId: number,
  ): Promise<{ codeToId: Map<string, number>; created: number }> {
    if (codes.length === 0) {
      return { codeToId: new Map(), created: 0 };
    }

    const normalizedCodes = codes.map((code) => normalizeSkuCode(code));
    const uniqueCodes = [...new Set(normalizedCodes)];

    let skus = await this.db
      .selectFrom('skus')
      .select(['id', 'code'])
      .where('shop_id', '=', shopId)
      .where('code', 'in', uniqueCodes)
      .execute();

    const existingCodes = new Set(skus.map((s) => s.code));
    const missingCodes = uniqueCodes.filter((code) => !existingCodes.has(code));

    if (missingCodes.length > 0) {
      const newSkus = await this.db
        .insertInto('skus')
        .values(
          missingCodes.map((code) => ({
            code,
            title: code,
            shop_id: shopId,
            tenant_id: tenantId,
            updated_at: new Date(),
          })),
        )
        .returning(['id', 'code'])
        .execute();

      skus = [...skus, ...newSkus];
    }

    return {
      codeToId: new Map(skus.map((s) => [s.code, s.id])),
      created: missingCodes.length,
    };
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
