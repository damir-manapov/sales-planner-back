import type { CreateUserRoleDto } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class UserRolesClient extends BaseClient {
  async createUserRole(dto: CreateUserRoleDto): Promise<void> {
    return this.request('POST', '/user-roles', { body: dto });
  }

  async deleteUserRole(id: number): Promise<void> {
    return this.request('DELETE', `/user-roles/${id}`);
  }
}
