import type {
  CreateUserRoleDto,
  GetUserRolesQuery,
  UserRoleResponse,
} from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class UserRolesClient extends BaseClient {
  async getUserRoles(query?: GetUserRolesQuery): Promise<UserRoleResponse[]> {
    const params = new URLSearchParams();
    if (query?.userId) params.append('userId', String(query.userId));
    if (query?.roleId) params.append('roleId', String(query.roleId));
    if (query?.tenantId) params.append('tenantId', String(query.tenantId));
    const queryString = params.toString();
    return this.request('GET', `/user-roles${queryString ? `?${queryString}` : ''}`);
  }

  async getUserRole(id: number): Promise<UserRoleResponse> {
    return this.request('GET', `/user-roles/${id}`);
  }

  async createUserRole(dto: CreateUserRoleDto): Promise<UserRoleResponse> {
    return this.request('POST', '/user-roles', { body: dto });
  }

  async deleteUserRole(id: number): Promise<void> {
    return this.request('DELETE', `/user-roles/${id}`);
  }
}
