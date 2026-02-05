import type { Role, CreateRoleRequest, UpdateRoleRequest } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class RolesClient extends BaseClient {
  async getRoles(): Promise<Role[]> {
    return this.request('GET', '/roles');
  }

  async getRole(id: number): Promise<Role> {
    return this.request('GET', `/roles/${id}`);
  }

  async createRole(request: CreateRoleRequest): Promise<Role> {
    return this.request('POST', '/roles', { body: request });
  }

  async updateRole(id: number, request: UpdateRoleRequest): Promise<Role> {
    return this.request('PUT', `/roles/${id}`, { body: request });
  }

  async deleteRole(id: number): Promise<void> {
    return this.request('DELETE', `/roles/${id}`);
  }
}
