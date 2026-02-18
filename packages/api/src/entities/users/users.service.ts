import { Injectable } from '@nestjs/common';
import type { PaginatedResponse, PaginationQuery, User } from '@sales-planner/shared';
import { sql } from 'kysely';
import { ROLE_NAMES } from '../../common/constants.js';
import { DuplicateResourceException, isUniqueViolation } from '../../common/index.js';
import { DatabaseService } from '../../database/index.js';
import type { CreateUserDto, UpdateUserDto } from './users.schema.js';

export type { User };
export type { CreateUserDto, UpdateUserDto };

export interface UserRole {
  id: number;
  roleName: string;
  tenantId: number | null;
  tenantTitle: string | null;
  shopId: number | null;
  shopTitle: string | null;
}

export interface ShopInfo {
  id: number;
  title: string;
}

export interface TenantInfo {
  id: number;
  title: string;
  isOwner: boolean;
  shops: ShopInfo[];
}

export interface UserWithRolesAndTenants extends User {
  roles: UserRole[];
  tenants: TenantInfo[];
}

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async count(): Promise<number> {
    const result = await this.db
      .selectFrom('users')
      .select(this.db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async countByTenantId(tenantId: number): Promise<number> {
    const result = await this.db
      .selectFrom('users')
      .innerJoin('user_roles', 'user_roles.userId', 'users.id')
      .select(this.db.fn.count<number>('users.id').distinct().as('count'))
      .where('user_roles.tenantId', '=', tenantId)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async findAll(query?: PaginationQuery): Promise<User[]> {
    let q = this.db.selectFrom('users').selectAll().orderBy('id', 'asc');
    if (query?.limit !== undefined) q = q.limit(query.limit);
    if (query?.offset !== undefined) q = q.offset(query.offset);
    return q.execute();
  }

  async findAllPaginated(query: PaginationQuery = {}): Promise<PaginatedResponse<User>> {
    const [total, items] = await Promise.all([this.count(), this.findAll(query)]);
    return { items, total, limit: query.limit ?? 0, offset: query.offset ?? 0 };
  }

  async findById(id: number): Promise<User | undefined> {
    return this.db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.db.selectFrom('users').selectAll().where('email', '=', email).executeTakeFirst();
  }

  async create(dto: CreateUserDto): Promise<User> {
    try {
      const result = await this.db
        .insertInto('users')
        .values({
          email: dto.email,
          name: dto.name,
          updatedAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return result;
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException('User', dto.email);
      }
      throw error;
    }
  }

  async update(id: number, dto: Partial<CreateUserDto>): Promise<User | undefined> {
    return this.db
      .updateTable('users')
      .set({ ...dto, updatedAt: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('users').where('id', '=', id).execute();
  }

  async findByTenantId(tenantId: number, query?: PaginationQuery): Promise<User[]> {
    // Users who have any role in this tenant (either tenant-level or shop-level)
    let q = this.db
      .selectFrom('users')
      .selectAll('users')
      .innerJoin('user_roles', 'user_roles.userId', 'users.id')
      .where('user_roles.tenantId', '=', tenantId)
      .groupBy('users.id')
      .orderBy('users.id', 'asc');
    if (query?.limit !== undefined) q = q.limit(query.limit);
    if (query?.offset !== undefined) q = q.offset(query.offset);
    return q.execute();
  }

  async findByTenantIdPaginated(
    tenantId: number,
    query: PaginationQuery = {},
  ): Promise<PaginatedResponse<User>> {
    const [total, items] = await Promise.all([
      this.countByTenantId(tenantId),
      this.findByTenantId(tenantId, query),
    ]);
    return { items, total, limit: query.limit ?? 0, offset: query.offset ?? 0 };
  }

  async getUserWithRolesAndTenants(userId: number): Promise<UserWithRolesAndTenants | null> {
    // Get user
    const user = await this.findById(userId);
    if (!user) {
      return null;
    }

    // Get user roles with tenant/shop titles
    const rolesResult = await this.db
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.roleId')
      .leftJoin('tenants', 'tenants.id', 'user_roles.tenantId')
      .leftJoin('shops', 'shops.id', 'user_roles.shopId')
      .select('user_roles.id')
      .select(sql<string>`roles.name`.as('roleName'))
      .select('user_roles.tenantId')
      .select(sql<string | null>`tenants.title`.as('tenantTitle'))
      .select('user_roles.shopId')
      .select(sql<string | null>`shops.title`.as('shopTitle'))
      .where('user_roles.userId', '=', userId)
      .execute();

    const roles: UserRole[] = rolesResult.map((r) => ({
      id: r.id,
      roleName: r.roleName,
      tenantId: r.tenantId,
      tenantTitle: r.tenantTitle,
      shopId: r.shopId,
      shopTitle: r.shopTitle,
    }));

    // Get tenants owned by this user to add derived tenantOwner roles
    const ownedTenantsResult = await this.db
      .selectFrom('tenants')
      .select('id')
      .select('title')
      .where('ownerId', '=', userId)
      .execute();

    // Add derived tenantOwner roles for owned tenants
    for (const ownedTenant of ownedTenantsResult) {
      roles.push({
        id: 0, // Synthetic role, no actual user_roles record
        roleName: 'tenantOwner',
        tenantId: ownedTenant.id,
        tenantTitle: ownedTenant.title,
        shopId: null,
        shopTitle: null,
      });
    }

    // Get all tenants user has access to (through roles or ownership)
    const tenantIds = [
      ...new Set([
        ...roles.filter((r) => r.tenantId !== null).map((r) => r.tenantId as number),
        ...ownedTenantsResult.map((t) => t.id),
      ]),
    ];

    // Get tenant details including ownership
    const tenantsResult = await this.db
      .selectFrom('tenants')
      .select('id')
      .select('title')
      .select('ownerId')
      .where('id', 'in', tenantIds.length > 0 ? tenantIds : [-1])
      .execute();

    // Determine which tenants user has full access to (tenantAdmin or owner)
    const fullAccessTenantIds = new Set<number>();
    for (const tenant of tenantsResult) {
      // User is owner
      if (tenant.ownerId === userId) {
        fullAccessTenantIds.add(tenant.id);
        continue;
      }
      // User has tenantAdmin role for this tenant
      const hasTenantAdmin = roles.some(
        (r) =>
          r.tenantId === tenant.id && r.roleName === ROLE_NAMES.TENANT_ADMIN && r.shopId === null,
      );
      if (hasTenantAdmin) {
        fullAccessTenantIds.add(tenant.id);
      }
    }

    // Get shop IDs from shop-level roles
    const shopLevelRoleShopIds = new Set(
      roles.filter((r) => r.shopId !== null).map((r) => r.shopId as number),
    );

    // Get shops for all tenants
    const shopsResult = await this.db
      .selectFrom('shops')
      .select('id')
      .select('title')
      .select('tenantId')
      .where('tenantId', 'in', tenantIds.length > 0 ? tenantIds : [-1])
      .execute();

    // Group shops by tenantId, filtering based on user's access level
    const shopsByTenant = shopsResult.reduce(
      (acc, shop) => {
        // Include shop if:
        // 1. User has full tenant access (owner or tenantAdmin), OR
        // 2. User has a shop-level role for this specific shop
        const hasFullTenantAccess = fullAccessTenantIds.has(shop.tenantId);
        const hasShopLevelRole = shopLevelRoleShopIds.has(shop.id);

        if (hasFullTenantAccess || hasShopLevelRole) {
          if (!acc[shop.tenantId]) {
            acc[shop.tenantId] = [];
          }
          acc[shop.tenantId]?.push({
            id: shop.id,
            title: shop.title,
          });
        }
        return acc;
      },
      {} as Record<number, ShopInfo[]>,
    );

    const tenants: TenantInfo[] = tenantsResult.map((t) => ({
      id: t.id,
      title: t.title,
      isOwner: t.ownerId === userId,
      shops: shopsByTenant[t.id] || [],
    }));

    return {
      ...user,
      roles,
      tenants,
    };
  }
}
