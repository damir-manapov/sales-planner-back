import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/index.js';

export interface CreateUserDto {
  email: string;
  name: string;
  api_key?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  api_key: string | null;
  created_at: Date;
  updated_at: Date;
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

  async findByApiKey(apiKey: string): Promise<User | undefined> {
    return this.db.selectFrom('users').selectAll().where('api_key', '=', apiKey).executeTakeFirst();
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
        api_key: dto.api_key ?? null,
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
}
