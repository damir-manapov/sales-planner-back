import type { UserWithRolesAndTenants } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class MeClient extends BaseClient {
  async getMe(): Promise<UserWithRolesAndTenants> {
    return this.request('GET', '/me');
  }
}
