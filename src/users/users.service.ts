import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/index.js';

export interface CreateUserDto {
  email: string;
  name: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
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

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('users').where('id', '=', id).execute();
  }
}
