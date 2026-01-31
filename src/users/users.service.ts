import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DatabaseService } from '../database/index.js';
import { ROLE_NAMES } from '../common/constants.js';

export interface CreateUserDto {
  email: string;
  name: string;
  default_shop_id?: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
  default_shop_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  id: number;
  role_name: string;
  tenant_id: number | null;
  tenant_title: string | null;
  shop_id: number | null;
  shop_title: string | null;
}

export interface ShopInfo {
  id: number;
  title: string;
}

export interface TenantInfo {
  id: number;
  title: string;
  is_owner: boolean;
  shops: ShopInfo[];
}

export interface UserWithRolesAndTenants extends User {
  roles: UserRole[];
  tenants: TenantInfo[];
}

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<User[]> {
    return this.db.selectFrom('users').selectAll().execute();
  }

  async findById(id: number): Promise<User | undefined> {
    return this.db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.db.selectFrom('users').selectAll().where('email', '=', email).executeTakeFirst();
  }

  async create(dto: CreateUserDto): Promise<User> {
    const result = await this.db
      .insertInto('users')
      .values({
        email: dto.email,
        name: dto.name,
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  async update(id: number, dto: Partial<CreateUserDto>): Promise<User | undefined> {
    return this.db
      .updateTable('users')
      .set({ ...dto, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('users').where('id', '=', id).execute();
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
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .leftJoin('tenants', 'tenants.id', 'user_roles.tenant_id')
      .leftJoin('shops', 'shops.id', 'user_roles.shop_id')
      .select('user_roles.id')
      .select(sql<string>`roles.name`.as('role_name'))
      .select('user_roles.tenant_id')
      .select(sql<string | null>`tenants.title`.as('tenant_title'))
      .select('user_roles.shop_id')
      .select(sql<string | null>`shops.title`.as('shop_title'))
      .where('user_roles.user_id', '=', userId)
      .execute();

    const roles: UserRole[] = rolesResult.map((r) => ({
      id: r.id,
      role_name: r.role_name,
      tenant_id: r.tenant_id,
      tenant_title: r.tenant_title,
      shop_id: r.shop_id,
      shop_title: r.shop_title,
    }));

    // Get tenants owned by this user to add derived tenantOwner roles
    const ownedTenantsResult = await this.db
      .selectFrom('tenants')
      .select('id')
      .select('title')
      .where('owner_id', '=', userId)
      .execute();

    // Add derived tenantOwner roles for owned tenants
    for (const ownedTenant of ownedTenantsResult) {
      roles.push({
        id: 0, // Synthetic role, no actual user_roles record
        role_name: 'tenantOwner',
        tenant_id: ownedTenant.id,
        tenant_title: ownedTenant.title,
        shop_id: null,
        shop_title: null,
      });
    }

    // Get all tenants user has access to (through roles or ownership)
    const tenantIds = [
      ...new Set([
        ...roles.filter((r) => r.tenant_id !== null).map((r) => r.tenant_id as number),
        ...ownedTenantsResult.map((t) => t.id),
      ]),
    ];

    // Get tenant details including ownership
    const tenantsResult = await this.db
      .selectFrom('tenants')
      .select('id')
      .select('title')
      .select('owner_id')
      .where('id', 'in', tenantIds.length > 0 ? tenantIds : [-1])
      .execute();

    // Determine which tenants user has full access to (tenantAdmin or owner)
    const fullAccessTenantIds = new Set<number>();
    for (const tenant of tenantsResult) {
      // User is owner
      if (tenant.owner_id === userId) {
        fullAccessTenantIds.add(tenant.id);
        continue;
      }
      // User has tenantAdmin role for this tenant
      const hasTenantAdmin = roles.some(
        (r) =>
          r.tenant_id === tenant.id &&
          r.role_name === ROLE_NAMES.TENANT_ADMIN &&
          r.shop_id === null,
      );
      if (hasTenantAdmin) {
        fullAccessTenantIds.add(tenant.id);
      }
    }

    // Get shop IDs from shop-level roles
    const shopLevelRoleShopIds = new Set(
      roles.filter((r) => r.shop_id !== null).map((r) => r.shop_id as number),
    );

    // Get shops for all tenants
    const shopsResult = await this.db
      .selectFrom('shops')
      .select('id')
      .select('title')
      .select('tenant_id')
      .where('tenant_id', 'in', tenantIds.length > 0 ? tenantIds : [-1])
      .execute();

    // Group shops by tenant_id, filtering based on user's access level
    const shopsByTenant = shopsResult.reduce(
      (acc, shop) => {
        // Include shop if:
        // 1. User has full tenant access (owner or tenantAdmin), OR
        // 2. User has a shop-level role for this specific shop
        const hasFullTenantAccess = fullAccessTenantIds.has(shop.tenant_id);
        const hasShopLevelRole = shopLevelRoleShopIds.has(shop.id);

        if (hasFullTenantAccess || hasShopLevelRole) {
          if (!acc[shop.tenant_id]) {
            acc[shop.tenant_id] = [];
          }
          acc[shop.tenant_id]?.push({
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
      is_owner: t.owner_id === userId,
      shops: shopsByTenant[t.id] || [],
    }));

    return {
      ...user,
      roles,
      tenants,
    };
  }
}
