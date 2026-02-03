import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/index.js';

export interface CreateMarketplaceDto {
  id: string;
  title: string;
}

export interface UpdateMarketplaceDto {
  title?: string;
}

export interface Marketplace {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

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
}
