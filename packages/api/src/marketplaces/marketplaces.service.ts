import { Injectable } from '@nestjs/common';
import type { Marketplace, MarketplaceExportItem } from '@sales-planner/shared';
import { DuplicateResourceException, isUniqueViolation } from '../common/index.js';
import { DatabaseService } from '../database/index.js';
import { normalizeId } from '../lib/index.js';
import type {
  CreateMarketplaceDto,
  ImportMarketplaceItem,
  UpdateMarketplaceDto,
} from './marketplaces.schema.js';
import { ImportMarketplaceItemSchema } from './marketplaces.schema.js';

export type { Marketplace };
export type { CreateMarketplaceDto, UpdateMarketplaceDto };

@Injectable()
export class MarketplacesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Marketplace[]> {
    return this.db.selectFrom('marketplaces').selectAll().execute();
  }

  async findByShopId(shopId: number): Promise<Marketplace[]> {
    return this.db.selectFrom('marketplaces').selectAll().where('shop_id', '=', shopId).execute();
  }

  async exportForShop(shopId: number): Promise<MarketplaceExportItem[]> {
    return this.db
      .selectFrom('marketplaces')
      .select(['id', 'title'])
      .where('shop_id', '=', shopId)
      .execute();
  }

  async findByTenantId(tenantId: number): Promise<Marketplace[]> {
    return this.db
      .selectFrom('marketplaces')
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .execute();
  }

  async findById(id: string, shopId: number): Promise<Marketplace | undefined> {
    return this.db
      .selectFrom('marketplaces')
      .selectAll()
      .where('id', '=', id)
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
  }

  async create(dto: CreateMarketplaceDto): Promise<Marketplace> {
    const normalizedId = normalizeId(dto.id);
    try {
      const result = await this.db
        .insertInto('marketplaces')
        .values({
          id: normalizedId,
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
        throw new DuplicateResourceException('Marketplace', normalizedId, 'this shop');
      }
      throw error;
    }
  }

  async update(
    id: string,
    shopId: number,
    dto: UpdateMarketplaceDto,
  ): Promise<Marketplace | undefined> {
    return this.db
      .updateTable('marketplaces')
      .set({ ...dto, updated_at: new Date() })
      .where('id', '=', id)
      .where('shop_id', '=', shopId)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: string, shopId: number): Promise<void> {
    await this.db
      .deleteFrom('marketplaces')
      .where('id', '=', id)
      .where('shop_id', '=', shopId)
      .execute();
  }

  async deleteByShopId(shopId: number): Promise<number> {
    const result = await this.db
      .deleteFrom('marketplaces')
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  /**
   * Ensures all given marketplace IDs exist for a specific shop, auto-creating missing ones.
   * Returns the count of newly created marketplaces.
   */
  async ensureExist(ids: string[], shopId: number, tenantId: number): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    // Normalize all IDs first (ids are already normalized from caller, but ensure consistency)
    const uniqueIds = [...new Set(ids)];

    const existing = await this.db
      .selectFrom('marketplaces')
      .select('id')
      .where('id', 'in', uniqueIds)
      .where('shop_id', '=', shopId)
      .execute();

    const existingIds = new Set(existing.map((m) => m.id));
    const missingIds = uniqueIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      await this.db
        .insertInto('marketplaces')
        .values(
          missingIds.map((id) => ({
            id,
            title: id,
            shop_id: shopId,
            tenant_id: tenantId,
            updated_at: new Date(),
          })),
        )
        .execute();
    }

    return missingIds.length;
  }

  async bulkUpsert(
    items: ImportMarketplaceItem[],
    shopId: number,
    tenantId: number,
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    if (items.length === 0) {
      return { created: 0, updated: 0, errors: [] };
    }

    const errors: string[] = [];
    const validItems: ImportMarketplaceItem[] = [];

    items.forEach((item, i) => {
      const result = ImportMarketplaceItemSchema.safeParse(item);
      if (!result.success) {
        const identifier =
          typeof item === 'object' && item && 'id' in item ? item.id : `index ${i}`;
        const errorMessages = result.error.issues.map((issue) => issue.message).join(', ');
        errors.push(`Invalid item "${identifier}": ${errorMessages}`);
        return;
      }

      // Normalize the marketplace ID
      const normalizedId = normalizeId(result.data.id);
      validItems.push({
        ...result.data,
        id: normalizedId,
      });
    });

    if (validItems.length === 0) {
      return { created: 0, updated: 0, errors };
    }

    // Get existing marketplaces for this shop in one query
    const existingIds = new Set(
      (
        await this.db
          .selectFrom('marketplaces')
          .select('id')
          .where('shop_id', '=', shopId)
          .where(
            'id',
            'in',
            validItems.map((i) => i.id),
          )
          .execute()
      ).map((r) => r.id),
    );

    // Use ON CONFLICT for efficient upsert
    await this.db
      .insertInto('marketplaces')
      .values(
        validItems.map((item) => ({
          id: item.id,
          title: item.title,
          shop_id: shopId,
          tenant_id: tenantId,
          updated_at: new Date(),
        })),
      )
      .onConflict((oc) =>
        oc.columns(['id', 'shop_id']).doUpdateSet({
          title: (eb) => eb.ref('excluded.title'),
          updated_at: new Date(),
        }),
      )
      .execute();

    const created = validItems.filter((i) => !existingIds.has(i.id)).length;
    const updated = validItems.filter((i) => existingIds.has(i.id)).length;

    return { created, updated, errors };
  }
}
