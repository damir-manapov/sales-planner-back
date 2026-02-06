import { Injectable } from '@nestjs/common';
import type { PaginatedResponse, PaginationQuery, Role } from '@sales-planner/shared';
import { DuplicateResourceException, isUniqueViolation } from '../common/index.js';
import { DatabaseService } from '../database/database.service.js';
import type { CreateRoleDto, UpdateRoleDto } from './roles.schema.js';

export type { Role };
export type { CreateRoleDto, UpdateRoleDto };

@Injectable()
export class RolesService {
  constructor(private readonly db: DatabaseService) {}

  async count(): Promise<number> {
    const result = await this.db
      .selectFrom('roles')
      .select(this.db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async findAll(query?: PaginationQuery): Promise<Role[]> {
    let q = this.db.selectFrom('roles').selectAll().orderBy('id', 'asc');
    if (query?.limit !== undefined) q = q.limit(query.limit);
    if (query?.offset !== undefined) q = q.offset(query.offset);
    return q.execute();
  }

  async findAllPaginated(query: PaginationQuery = {}): Promise<PaginatedResponse<Role>> {
    const [total, items] = await Promise.all([this.count(), this.findAll(query)]);
    return { items, total, limit: query.limit ?? 0, offset: query.offset ?? 0 };
  }

  async findById(id: number): Promise<Role | undefined> {
    return this.db.selectFrom('roles').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async findByName(name: string): Promise<Role | undefined> {
    return this.db.selectFrom('roles').selectAll().where('name', '=', name).executeTakeFirst();
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    try {
      return this.db.insertInto('roles').values(dto).returningAll().executeTakeFirstOrThrow();
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException('Role', dto.name);
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateRoleDto): Promise<Role | undefined> {
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
