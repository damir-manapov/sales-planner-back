import type { ApiKey, CreateApiKeyDto } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class ApiKeysClient extends BaseClient {
  async getApiKeys(userId?: number): Promise<ApiKey[]> {
    return this.request('GET', '/api-keys', { params: { user_id: userId } });
  }

  async createApiKey(dto: CreateApiKeyDto): Promise<ApiKey> {
    return this.request('POST', '/api-keys', { body: dto });
  }

  async deleteApiKey(id: number): Promise<void> {
    return this.request('DELETE', `/api-keys/${id}`);
  }
}
