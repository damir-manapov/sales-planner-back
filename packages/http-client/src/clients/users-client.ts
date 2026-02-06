import type { User, CreateUserRequest, PaginatedResponse, PaginationQuery } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export interface GetUsersQuery extends PaginationQuery {
  tenantId?: number;
}

export class UsersClient extends BaseClient {
  async getAll(query?: GetUsersQuery): Promise<PaginatedResponse<User>> {
    return this.request('GET', '/users', { params: query as Record<string, string | number | undefined> });
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
