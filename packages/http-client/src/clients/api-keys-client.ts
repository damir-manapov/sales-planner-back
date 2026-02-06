import type { ApiKey, CreateApiKeyRequest, PaginatedResponse, PaginationQuery } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export interface GetApiKeysQuery extends PaginationQuery {
  user_id?: number;
}

export class ApiKeysClient extends BaseClient {
  async getAll(query?: GetApiKeysQuery): Promise<PaginatedResponse<ApiKey>> {
    return this.request('GET', '/api-keys', { params: query as Record<string, string | number | undefined> });
  }

  async create(request: CreateApiKeyRequest): Promise<ApiKey> {
    return this.request('POST', '/api-keys', { body: request });
  }

  async delete(id: number): Promise<void> {
    return this.request('DELETE', `/api-keys/${id}`);
  }
}
