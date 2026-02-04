import { Injectable } from '@nestjs/common';
import type { Role } from '@sales-planner/shared';
import { DatabaseService } from '../database/database.service.js';
import type { CreateRoleDto, UpdateRoleDto } from './roles.schema.js';

export type { Role };
export type { CreateRoleDto, UpdateRoleDto };

@Injectable()
export class RolesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Role[]> {
    return this.db.selectFrom('roles').selectAll().execute();
  }

  async findById(id: number): Promise<Role | undefined> {
    return this.db.selectFrom('roles').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async findByName(name: string): Promise<Role | undefined> {
    return this.db.selectFrom('roles').selectAll().where('name', '=', name).executeTakeFirst();
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    return this.db.insertInto('roles').values(dto).returningAll().executeTakeFirstOrThrow();
  }

  async update(id: number, dto: Partial<CreateRoleDto>): Promise<Role | undefined> {
    return this.db
      .updateTable('roles')
      .set({ ...dto, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('roles').where('id', '=', id).execute();
  }
}
