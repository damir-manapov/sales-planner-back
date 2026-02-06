import { Injectable } from '@nestjs/common';
import type { ApiKey, PaginatedResponse, PaginationQuery } from '@sales-planner/shared';
import { DuplicateResourceException, isUniqueViolation } from '../../common/index.js';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class ApiKeysService {
  constructor(private readonly db: DatabaseService) {}

  async count(): Promise<number> {
    const result = await this.db
      .selectFrom('api_keys')
      .select(this.db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async countByUserId(userId: number): Promise<number> {
    const result = await this.db
      .selectFrom('api_keys')
      .select(this.db.fn.countAll<number>().as('count'))
      .where('user_id', '=', userId)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async findAll(query?: PaginationQuery): Promise<ApiKey[]> {
    let q = this.db.selectFrom('api_keys').selectAll().orderBy('id', 'asc');
    if (query?.limit !== undefined) q = q.limit(query.limit);
    if (query?.offset !== undefined) q = q.offset(query.offset);
    return q.execute();
  }

  async findAllPaginated(query: PaginationQuery = {}): Promise<PaginatedResponse<ApiKey>> {
    const [total, items] = await Promise.all([this.count(), this.findAll(query)]);
    return { items, total, limit: query.limit ?? 0, offset: query.offset ?? 0 };
  }

  async findById(id: number) {
    return this.db.selectFrom('api_keys').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async findByKey(key: string) {
    return this.db.selectFrom('api_keys').selectAll().where('key', '=', key).executeTakeFirst();
  }

  async findByUserId(userId: number, query?: PaginationQuery): Promise<ApiKey[]> {
    let q = this.db
      .selectFrom('api_keys')
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
  ): Promise<PaginatedResponse<ApiKey>> {
    const [total, items] = await Promise.all([
      this.countByUserId(userId),
      this.findByUserId(userId, query),
    ]);
    return { items, total, limit: query.limit ?? 0, offset: query.offset ?? 0 };
  }

  async findValidByKey(key: string) {
    const apiKey = await this.findByKey(key);
    if (!apiKey) return null;

    // Check expiration
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return null;
    }

    // Update last_used_at
    await this.db
      .updateTable('api_keys')
      .set({ last_used_at: new Date(), updated_at: new Date() })
      .where('id', '=', apiKey.id)
      .execute();

    return apiKey;
  }

  async create(data: { user_id: number; name?: string; expires_at?: Date | string }) {
    const key = crypto.randomUUID();
    try {
      return this.db
        .insertInto('api_keys')
        .values({
          user_id: data.user_id,
          key: key,
          name: data.name,
          expires_at: data.expires_at ? new Date(data.expires_at) : null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException('API Key', key);
      }
      throw error;
    }
  }

  // Internal method for bootstrap - allows setting a specific key
  async createWithKey(data: {
    user_id: number;
    key: string;
    name?: string;
    expires_at?: Date | string;
  }) {
    try {
      return this.db
        .insertInto('api_keys')
        .values({
          user_id: data.user_id,
          key: data.key,
          name: data.name,
          expires_at: data.expires_at ? new Date(data.expires_at) : null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException('API Key', data.key);
      }
      throw error;
    }
  }

  async update(id: number, data: { name?: string | null; expires_at?: string | Date | null }) {
    return this.db
      .updateTable('api_keys')
      .set({
        ...data,
        expires_at: data.expires_at ? new Date(data.expires_at) : null,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: number) {
    return this.db.deleteFrom('api_keys').where('id', '=', id).returningAll().executeTakeFirst();
  }

  async deleteByUserId(userId: number) {
    return this.db.deleteFrom('api_keys').where('user_id', '=', userId).execute();
  }
}
