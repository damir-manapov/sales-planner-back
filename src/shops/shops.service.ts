import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { ShopsTable } from '../database/database.types.js';
import { Insertable, Selectable } from 'kysely';

export type Shop = Selectable<ShopsTable>;
export type CreateShopDto = Insertable<ShopsTable>;

@Injectable()
export class ShopsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Shop[]> {
    return this.db.selectFrom('shops').selectAll().execute();
  }

  async findByTenantId(tenantId: number): Promise<Shop[]> {
    return this.db.selectFrom('shops').selectAll().where('tenant_id', '=', tenantId).execute();
  }

  async findById(id: number): Promise<Shop | undefined> {
    return this.db.selectFrom('shops').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async create(dto: CreateShopDto): Promise<Shop> {
    return this.db.insertInto('shops').values(dto).returningAll().executeTakeFirstOrThrow();
  }

  async update(id: number, dto: Partial<CreateShopDto>): Promise<Shop | undefined> {
    return this.db
      .updateTable('shops')
      .set({ ...dto, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('shops').where('id', '=', id).execute();
  }
}
