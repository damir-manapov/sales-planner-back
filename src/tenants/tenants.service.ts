import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { Tenants } from '../database/database.types.js';
import { Insertable, Selectable } from 'kysely';

export type Tenant = Selectable<Tenants>;
export type CreateTenantDto = Insertable<Tenants>;

export interface CreateTenantWithShopDto {
  tenantTitle: string;
  shopTitle: string;
  ownerId: number;
}

export interface TenantWithShopAndApiKey {
  tenant: Tenant;
  shop: {
    id: number;
    title: string;
    tenant_id: number;
  };
  apiKey: string;
}

@Injectable()
export class TenantsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Tenant[]> {
    return this.db.selectFrom('tenants').selectAll().execute();
  }

  async findById(id: number): Promise<Tenant | undefined> {
    return this.db.selectFrom('tenants').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async findByOwnerId(ownerId: number): Promise<Tenant[]> {
    return this.db.selectFrom('tenants').selectAll().where('owner_id', '=', ownerId).execute();
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

  async createTenantWithShop(dto: CreateTenantWithShopDto): Promise<TenantWithShopAndApiKey> {
    return this.db.transaction().execute(async (trx) => {
      // Create tenant
      const tenant = await trx
        .insertInto('tenants')
        .values({
          title: dto.tenantTitle,
          owner_id: dto.ownerId,
          created_by: dto.ownerId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Create shop under tenant
      const shop = await trx
        .insertInto('shops')
        .values({
          title: dto.shopTitle,
          tenant_id: tenant.id,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Get user's first API key
      const apiKey = await trx
        .selectFrom('api_keys')
        .select('key')
        .where('user_id', '=', dto.ownerId)
        .orderBy('created_at', 'asc')
        .limit(1)
        .executeTakeFirst();

      if (!apiKey) {
        throw new Error(`User ${dto.ownerId} does not have any API keys`);
      }

      return {
        tenant,
        shop: {
          id: shop.id,
          title: shop.title,
          tenant_id: shop.tenant_id,
        },
        apiKey: apiKey.key,
      };
    });
  }
}
