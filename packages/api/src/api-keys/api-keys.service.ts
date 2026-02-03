import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ApiKeysService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    return this.db.selectFrom('api_keys').selectAll().execute();
  }

  async findById(id: number) {
    return this.db.selectFrom('api_keys').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async findByKey(key: string) {
    return this.db.selectFrom('api_keys').selectAll().where('key', '=', key).executeTakeFirst();
  }

  async findByUserId(userId: number) {
    return this.db.selectFrom('api_keys').selectAll().where('user_id', '=', userId).execute();
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

  async create(data: { user_id: number; key: string; name?: string; expires_at?: Date | string }) {
    return this.db
      .insertInto('api_keys')
      .values({
        user_id: data.user_id,
        key: data.key,
        name: data.name ?? null,
        expires_at: data.expires_at ? new Date(data.expires_at) : null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: number, data: { name?: string; expires_at?: Date | string | null }) {
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
