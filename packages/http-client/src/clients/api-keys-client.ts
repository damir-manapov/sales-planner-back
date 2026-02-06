import type { ApiKey, CreateApiKeyRequest } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class ApiKeysClient extends BaseClient {
  async getAll(userId?: number): Promise<ApiKey[]> {
    return this.request('GET', '/api-keys', { params: { user_id: userId } });
  }

  async create(request: CreateApiKeyRequest): Promise<ApiKey> {
    return this.request('POST', '/api-keys', { body: request });
  }

  async delete(id: number): Promise<void> {
    return this.request('DELETE', `/api-keys/${id}`);
  }
}
