import { Injectable } from '@nestjs/common';
import type { PaginatedResponse, PaginationQuery, Tenant } from '@sales-planner/shared';
import { ROLE_NAMES } from '../../common/constants.js';
import { DatabaseService } from '../../database/database.service.js';
import type {
  CreateTenantDto,
  CreateTenantWithShopDto,
  UpdateTenantDto,
} from './tenants.schema.js';

export type { Tenant };
export type { CreateTenantDto, CreateTenantWithShopDto, UpdateTenantDto };

// Internal type with required createdBy (for DB operations)
type CreateTenantInput = CreateTenantDto & { createdBy: number };

export interface TenantWithShopAndApiKey {
  tenant: Tenant;
  shop: {
    id: number;
    title: string;
    tenantId: number;
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

  async count(): Promise<number> {
    const result = await this.db
      .selectFrom('tenants')
      .select(this.db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async countByOwnerId(ownerId: number): Promise<number> {
    const result = await this.db
      .selectFrom('tenants')
      .select(this.db.fn.countAll<number>().as('count'))
      .where('ownerId', '=', ownerId)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async findAll(query?: PaginationQuery): Promise<Tenant[]> {
    let q = this.db.selectFrom('tenants').selectAll().orderBy('id', 'asc');
    if (query?.limit !== undefined) q = q.limit(query.limit);
    if (query?.offset !== undefined) q = q.offset(query.offset);
    return q.execute();
  }

  async findAllPaginated(query: PaginationQuery = {}): Promise<PaginatedResponse<Tenant>> {
    const [total, items] = await Promise.all([this.count(), this.findAll(query)]);
    return { items, total, limit: query.limit ?? 0, offset: query.offset ?? 0 };
  }

  async findById(id: number): Promise<Tenant | undefined> {
    return this.db.selectFrom('tenants').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async findByOwnerId(ownerId: number, query?: PaginationQuery): Promise<Tenant[]> {
    let q = this.db
      .selectFrom('tenants')
      .selectAll()
      .where('ownerId', '=', ownerId)
      .orderBy('id', 'asc');
    if (query?.limit !== undefined) q = q.limit(query.limit);
    if (query?.offset !== undefined) q = q.offset(query.offset);
    return q.execute();
  }

  async findByOwnerIdPaginated(
    ownerId: number,
    query: PaginationQuery = {},
  ): Promise<PaginatedResponse<Tenant>> {
    const [total, items] = await Promise.all([
      this.countByOwnerId(ownerId),
      this.findByOwnerId(ownerId, query),
    ]);
    return { items, total, limit: query.limit ?? 0, offset: query.offset ?? 0 };
  }

  async create(dto: CreateTenantInput): Promise<Tenant> {
    return this.db.insertInto('tenants').values(dto).returningAll().executeTakeFirstOrThrow();
  }

  async update(id: number, dto: UpdateTenantDto): Promise<Tenant | undefined> {
    return this.db
      .updateTable('tenants')
      .set({ ...dto, updatedAt: new Date() })
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
          updatedAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Generate API key for the user
      const apiKeyValue = `sk_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      await trx
        .insertInto('api_keys')
        .values({
          userId: user.id,
          key: apiKeyValue,
          name: 'Default API Key',
        })
        .execute();

      // Create tenant with user as owner
      const tenant = await trx
        .insertInto('tenants')
        .values({
          title: dto.tenantTitle,
          ownerId: user.id,
          createdBy: user.id,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Create shop under tenant
      const shop = await trx
        .insertInto('shops')
        .values({
          title: dto.shopTitle || dto.tenantTitle,
          tenantId: tenant.id,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Assign tenantAdmin role to user
      const tenantAdminRole = await trx
        .selectFrom('roles')
        .select('id')
        .where('name', '=', ROLE_NAMES.TENANT_ADMIN)
        .executeTakeFirst();

      if (tenantAdminRole) {
        await trx
          .insertInto('user_roles')
          .values({
            userId: user.id,
            roleId: tenantAdminRole.id,
            tenantId: tenant.id,
          })
          .execute();
      }

      return {
        tenant,
        shop: {
          id: shop.id,
          title: shop.title,
          tenantId: shop.tenantId,
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
