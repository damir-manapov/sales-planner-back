import type { Role, CreateRoleDto } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class RolesClient extends BaseClient {
  async getRoles(): Promise<Role[]> {
    return this.request('GET', '/roles');
  }

  async getRole(id: number): Promise<Role> {
    return this.request('GET', `/roles/${id}`);
  }

  async createRole(dto: CreateRoleDto): Promise<Role> {
    return this.request('POST', '/roles', { body: dto });
  }

  async updateRole(id: number, dto: Partial<CreateRoleDto>): Promise<Role> {
    return this.request('PUT', `/roles/${id}`, { body: dto });
  }

  async deleteRole(id: number): Promise<void> {
    return this.request('DELETE', `/roles/${id}`);
  }
}
