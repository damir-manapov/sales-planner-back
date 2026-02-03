import { Injectable } from '@nestjs/common';
import { Insertable, Selectable } from 'kysely';
import { DatabaseService } from '../database/database.service.js';
import { Shops } from '../database/database.types.js';
import { SalesHistoryService } from '../sales-history/sales-history.service.js';
import { SkusService } from '../skus/skus.service.js';

export type Shop = Selectable<Shops>;
export type CreateShopDto = Insertable<Shops>;

@Injectable()
export class ShopsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly skusService: SkusService,
    private readonly salesHistoryService: SalesHistoryService,
  ) {}

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

  async deleteData(id: number): Promise<{ skusDeleted: number; salesHistoryDeleted: number }> {
    // Delete sales history first (references SKUs)
    const salesHistoryDeleted = await this.salesHistoryService.deleteByShopId(id);

    // Delete SKUs
    const skusDeleted = await this.skusService.deleteByShopId(id);

    return { skusDeleted, salesHistoryDeleted };
  }
}
