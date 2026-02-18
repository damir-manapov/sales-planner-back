import type { Role, PaginatedResponse, PaginationQuery } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class RolesClient extends BaseClient {
  async getAll(query?: PaginationQuery): Promise<PaginatedResponse<Role>> {
    return this.request('GET', '/roles', {
      params: query as Record<string, string | number | undefined>,
    });
  }

  async getById(id: number): Promise<Role> {
    return this.request('GET', `/roles/${id}`);
  }
}
