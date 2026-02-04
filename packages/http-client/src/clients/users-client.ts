import type { User, CreateUserDto } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class UsersClient extends BaseClient {
  async getUsers(): Promise<User[]> {
    return this.request('GET', '/users');
  }

  async getUser(id: number): Promise<User> {
    return this.request('GET', `/users/${id}`);
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    return this.request('POST', '/users', { body: dto });
  }

  async deleteUser(id: number): Promise<void> {
    return this.request('DELETE', `/users/${id}`);
  }
}
