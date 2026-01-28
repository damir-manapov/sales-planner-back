import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { TenantsTable } from '../database/database.types.js';
import { Insertable, Selectable } from 'kysely';

export type Tenant = Selectable<TenantsTable>;
export type CreateTenantDto = Insertable<TenantsTable>;

@Injectable()
export class TenantsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Tenant[]> {
    return this.db.selectFrom('tenants').selectAll().execute();
  }

  async findById(id: number): Promise<Tenant | undefined> {
    return this.db.selectFrom('tenants').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async create(dto: CreateTenantDto): Promise<Tenant> {
    return this.db.insertInto('tenants').values(dto).returningAll().executeTakeFirstOrThrow();
  }

  async update(id: number, dto: Partial<CreateTenantDto>): Promise<Tenant | undefined> {
    return this.db
      .updateTable('tenants')
      .set({ ...dto, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('tenants').where('id', '=', id).execute();
  }
}
