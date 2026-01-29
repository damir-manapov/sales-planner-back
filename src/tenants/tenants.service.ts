import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { Tenants } from '../database/database.types.js';
import { Insertable, Selectable } from 'kysely';

export type Tenant = Selectable<Tenants>;
export type CreateTenantDto = Insertable<Tenants>;

export interface CreateTenantWithShopDto {
  tenantTitle: string;
  shopTitle: string;
  userEmail: string;
  userName: string;
}

export interface TenantWithShopAndApiKey {
  tenant: Tenant;
  shop: {
    id: number;
    title: string;
    tenant_id: number;
  };
  user: {
    id: number;
    email: string;
    name: string;
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

  async createTenantWithShopAndUser(
    dto: CreateTenantWithShopDto,
  ): Promise<TenantWithShopAndApiKey> {
    return this.db.transaction().execute(async (trx) => {
      // Create user
      const user = await trx
        .insertInto('users')
        .values({
          email: dto.userEmail,
          name: dto.userName,
          updated_at: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Generate API key for the user
      const apiKeyValue = `sk_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      await trx
        .insertInto('api_keys')
        .values({
          user_id: user.id,
          key: apiKeyValue,
          name: 'Default API Key',
        })
        .execute();

      // Create tenant with user as owner
      const tenant = await trx
        .insertInto('tenants')
        .values({
          title: dto.tenantTitle,
          owner_id: user.id,
          created_by: user.id,
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

      return {
        tenant,
        shop: {
          id: shop.id,
          title: shop.title,
          tenant_id: shop.tenant_id,
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        apiKey: apiKeyValue,
      };
    });
  }
}
