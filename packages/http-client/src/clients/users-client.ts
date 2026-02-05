import type { User, CreateUserRequest } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class UsersClient extends BaseClient {
  async getUsers(): Promise<User[]> {
    return this.request('GET', '/users');
  }

  async getUser(id: number): Promise<User> {
    return this.request('GET', `/users/${id}`);
  }

  async createUser(request: CreateUserRequest): Promise<User> {
    return this.request('POST', '/users', { body: request });
  }

  async deleteUser(id: number): Promise<void> {
    return this.request('DELETE', `/users/${id}`);
  }
}
