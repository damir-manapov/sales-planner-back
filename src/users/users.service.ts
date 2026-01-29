import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/index.js';
import { sql } from 'kysely';

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
  tenant_name: string | null;
  shop_id: number | null;
  shop_name: string | null;
}

export interface TenantInfo {
  id: number;
  name: string;
  is_owner: boolean;
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

    // Get user roles with tenant/shop names
    const rolesResult = await this.db
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .leftJoin('tenants', 'tenants.id', 'user_roles.tenant_id')
      .leftJoin('shops', 'shops.id', 'user_roles.shop_id')
      .select('user_roles.id')
      .select(sql<string>`roles.name`.as('role_name'))
      .select('user_roles.tenant_id')
      .select(sql<string | null>`tenants.title`.as('tenant_name'))
      .select('user_roles.shop_id')
      .select(sql<string | null>`shops.title`.as('shop_name'))
      .where('user_roles.user_id', '=', userId)
      .execute();

    const roles: UserRole[] = rolesResult.map((r) => ({
      id: r.id ?? 0,
      role_name: r.role_name,
      tenant_id: r.tenant_id,
      tenant_name: r.tenant_name,
      shop_id: r.shop_id,
      shop_name: r.shop_name,
    }));

    // Get all tenants user has access to (through roles)
    const tenantIds = [
      ...new Set(roles.filter((r) => r.tenant_id !== null).map((r) => r.tenant_id as number)),
    ];

    // Get tenant details including ownership
    const tenantsResult = await this.db
      .selectFrom('tenants')
      .select('id')
      .select(sql<string>`title`.as('name'))
      .select('owner_id')
      .where('id', 'in', tenantIds.length > 0 ? tenantIds : [-1])
      .execute();

    const tenants: TenantInfo[] = tenantsResult.map((t) => ({
      id: t.id,
      name: t.name,
      is_owner: t.owner_id === userId,
    }));

    return {
      ...user,
      roles,
      tenants,
    };
  }
}
