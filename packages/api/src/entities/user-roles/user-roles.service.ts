import { Injectable } from '@nestjs/common';
import type { PaginatedResponse, PaginationQuery } from '@sales-planner/shared';
import { type Selectable } from 'kysely';
import { DuplicateResourceException, isUniqueViolation } from '../../common/index.js';
import { DatabaseService } from '../../database/database.service.js';
import { type UserRoles } from '../../database/database.types.js';
import type { CreateUserRoleDto } from './user-roles.schema.js';

export type UserRole = Selectable<UserRoles>;
export type { CreateUserRoleDto };

interface UserRoleWithName {
  tenant_id: number | null;
  shop_id: number | null;
  role_name: string;
}

@Injectable()
export class UserRolesService {
  constructor(private readonly db: DatabaseService) {}

  async count(): Promise<number> {
    const result = await this.db
      .selectFrom('user_roles')
      .select(this.db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async countByTenantId(tenantId: number): Promise<number> {
    const result = await this.db
      .selectFrom('user_roles')
      .select(this.db.fn.countAll<number>().as('count'))
      .where('tenant_id', '=', tenantId)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async countByUserId(userId: number): Promise<number> {
    const result = await this.db
      .selectFrom('user_roles')
      .select(this.db.fn.countAll<number>().as('count'))
      .where('user_id', '=', userId)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async countByRoleId(roleId: number): Promise<number> {
    const result = await this.db
      .selectFrom('user_roles')
      .select(this.db.fn.countAll<number>().as('count'))
      .where('role_id', '=', roleId)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async findAll(query?: PaginationQuery): Promise<UserRole[]> {
    let q = this.db.selectFrom('user_roles').selectAll().orderBy('id', 'asc');
    if (query?.limit !== undefined) q = q.limit(query.limit);
    if (query?.offset !== undefined) q = q.offset(query.offset);
    return q.execute();
  }

  async findAllPaginated(query: PaginationQuery = {}): Promise<PaginatedResponse<UserRole>> {
    const [total, items] = await Promise.all([this.count(), this.findAll(query)]);
    return { items, total, limit: query.limit ?? 0, offset: query.offset ?? 0 };
  }

  async findByUserId(userId: number, query?: PaginationQuery): Promise<UserRole[]> {
    let q = this.db
      .selectFrom('user_roles')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('id', 'asc');
    if (query?.limit !== undefined) q = q.limit(query.limit);
    if (query?.offset !== undefined) q = q.offset(query.offset);
    return q.execute();
  }

  async findByUserIdPaginated(
    userId: number,
    query: PaginationQuery = {},
  ): Promise<PaginatedResponse<UserRole>> {
    const [total, items] = await Promise.all([
      this.countByUserId(userId),
      this.findByUserId(userId, query),
    ]);
    return { items, total, limit: query.limit ?? 0, offset: query.offset ?? 0 };
  }

  async findByRoleId(roleId: number, query?: PaginationQuery): Promise<UserRole[]> {
    let q = this.db
      .selectFrom('user_roles')
      .selectAll()
      .where('role_id', '=', roleId)
      .orderBy('id', 'asc');
    if (query?.limit !== undefined) q = q.limit(query.limit);
    if (query?.offset !== undefined) q = q.offset(query.offset);
    return q.execute();
  }

  async findByRoleIdPaginated(
    roleId: number,
    query: PaginationQuery = {},
  ): Promise<PaginatedResponse<UserRole>> {
    const [total, items] = await Promise.all([
      this.countByRoleId(roleId),
      this.findByRoleId(roleId, query),
    ]);
    return { items, total, limit: query.limit ?? 0, offset: query.offset ?? 0 };
  }

  async findByTenantId(tenantId: number, query?: PaginationQuery): Promise<UserRole[]> {
    let q = this.db
      .selectFrom('user_roles')
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .orderBy('id', 'asc');
    if (query?.limit !== undefined) q = q.limit(query.limit);
    if (query?.offset !== undefined) q = q.offset(query.offset);
    return q.execute();
  }

  async findByTenantIdPaginated(
    tenantId: number,
    query: PaginationQuery = {},
  ): Promise<PaginatedResponse<UserRole>> {
    const [total, items] = await Promise.all([
      this.countByTenantId(tenantId),
      this.findByTenantId(tenantId, query),
    ]);
    return { items, total, limit: query.limit ?? 0, offset: query.offset ?? 0 };
  }

  async findById(id: number): Promise<UserRole | undefined> {
    return this.db.selectFrom('user_roles').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async hasRole(userId: number, roleName: string, tenantId?: number): Promise<boolean> {
    let query = this.db
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .select('user_roles.id')
      .where('user_roles.user_id', '=', userId)
      .where('roles.name', '=', roleName);

    if (tenantId !== undefined) {
      query = query.where('user_roles.tenant_id', '=', tenantId);
    }

    const result = await query.executeTakeFirst();
    return !!result;
  }

  async create(dto: CreateUserRoleDto): Promise<UserRole> {
    try {
      return this.db.insertInto('user_roles').values(dto).returningAll().executeTakeFirstOrThrow();
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException(
          'User Role',
          `User ${dto.user_id} - Role ${dto.role_id}`,
        );
      }
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('user_roles').where('id', '=', id).execute();
  }

  async deleteByUserAndRole(userId: number, roleId: number): Promise<void> {
    await this.db
      .deleteFrom('user_roles')
      .where('user_id', '=', userId)
      .where('role_id', '=', roleId)
      .execute();
  }

  async findByUserIdWithRoleNames(userId: number): Promise<UserRoleWithName[]> {
    return this.db
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .select(['user_roles.tenant_id', 'user_roles.shop_id', 'roles.name as role_name'])
      .where('user_roles.user_id', '=', userId)
      .execute();
  }
}
