import type {
  CreateUserRoleRequest,
  GetUserRolesQuery,
  UserRoleResponse,
  PaginatedResponse,
  PaginationQuery,
} from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export interface GetUserRolesQueryWithPagination extends GetUserRolesQuery, PaginationQuery {}

export class UserRolesClient extends BaseClient {
  async getAll(query?: GetUserRolesQueryWithPagination): Promise<PaginatedResponse<UserRoleResponse>> {
    const params: Record<string, string | number | undefined> = {};
    if (query?.userId) params.userId = query.userId;
    if (query?.roleId) params.roleId = query.roleId;
    if (query?.tenantId) params.tenantId = query.tenantId;
    if (query?.limit) params.limit = query.limit;
    if (query?.offset) params.offset = query.offset;
    return this.request('GET', '/user-roles', { params });
  }

  async getById(id: number): Promise<UserRoleResponse> {
    return this.request('GET', `/user-roles/${id}`);
  }

  async create(request: CreateUserRoleRequest): Promise<UserRoleResponse> {
    return this.request('POST', '/user-roles', { body: request });
  }

  async delete(id: number): Promise<void> {
    return this.request('DELETE', `/user-roles/${id}`);
  }
}
