import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { UserRolesTable } from '../database/database.types.js';
import { Insertable, Selectable } from 'kysely';

export type UserRole = Selectable<UserRolesTable>;
export type CreateUserRoleDto = Insertable<UserRolesTable>;

@Injectable()
export class UserRolesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<UserRole[]> {
    return this.db.selectFrom('user_roles').selectAll().execute();
  }

  async findByUserId(userId: number): Promise<UserRole[]> {
    return this.db.selectFrom('user_roles').selectAll().where('user_id', '=', userId).execute();
  }

  async findByRoleId(roleId: number): Promise<UserRole[]> {
    return this.db.selectFrom('user_roles').selectAll().where('role_id', '=', roleId).execute();
  }

  async findByTenantId(tenantId: number): Promise<UserRole[]> {
    return this.db.selectFrom('user_roles').selectAll().where('tenant_id', '=', tenantId).execute();
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
    return this.db.insertInto('user_roles').values(dto).returningAll().executeTakeFirstOrThrow();
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
}
