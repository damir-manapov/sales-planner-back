import { Injectable } from '@nestjs/common';
import type { Marketplace } from '@sales-planner/shared';
import { DatabaseService } from '../database/index.js';
import type { CreateMarketplaceDto, UpdateMarketplaceDto } from './marketplaces.schema.js';

export type { Marketplace };
export type { CreateMarketplaceDto, UpdateMarketplaceDto };

@Injectable()
export class MarketplacesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Marketplace[]> {
    return this.db.selectFrom('marketplaces').selectAll().execute();
  }

  async findById(id: string): Promise<Marketplace | undefined> {
    return this.db.selectFrom('marketplaces').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async create(dto: CreateMarketplaceDto): Promise<Marketplace> {
    const result = await this.db
      .insertInto('marketplaces')
      .values({
        id: dto.id,
        title: dto.title,
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  async update(id: string, dto: UpdateMarketplaceDto): Promise<Marketplace | undefined> {
    return this.db
      .updateTable('marketplaces')
      .set({ ...dto, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('marketplaces').where('id', '=', id).execute();
  }

  /**
   * Ensures all given marketplace IDs exist, auto-creating missing ones.
   * Returns the count of newly created marketplaces.
   */
  async ensureExist(ids: string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const uniqueIds = [...new Set(ids)];

    const existing = await this.db
      .selectFrom('marketplaces')
      .select('id')
      .where('id', 'in', uniqueIds)
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
            updated_at: new Date(),
          })),
        )
        .execute();
    }

    return missingIds.length;
  }
}
