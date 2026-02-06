import type { User, CreateUserRequest } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class UsersClient extends BaseClient {
  async getAll(): Promise<User[]> {
    return this.request('GET', '/users');
  }

  async getById(id: number): Promise<User> {
    return this.request('GET', `/users/${id}`);
  }

  async create(request: CreateUserRequest): Promise<User> {
    return this.request('POST', '/users', { body: request });
  }

  async delete(id: number): Promise<void> {
    return this.request('DELETE', `/users/${id}`);
  }
}
