import type {
  ApiKey,
  CreateApiKeyRequest,
  PaginatedResponse,
  PaginationQuery,
} from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export interface GetApiKeysQuery extends PaginationQuery {
  userId?: number;
}

export class ApiKeysClient extends BaseClient {
  async getAll(query?: GetApiKeysQuery): Promise<PaginatedResponse<ApiKey>> {
    return this.request('GET', '/api-keys', {
      params: query as Record<string, string | number | undefined>,
    });
  }

  async getById(id: number): Promise<ApiKey> {
    return this.request('GET', `/api-keys/${id}`);
  }

  async create(request: CreateApiKeyRequest): Promise<ApiKey> {
    return this.request('POST', '/api-keys', { body: request });
  }

  async delete(id: number): Promise<void> {
    return this.request('DELETE', `/api-keys/${id}`);
  }
}
