import { BaseClient, type ClientConfig } from './base-client.js';

/**
 * Generic CRUD client for simple resources identified by numeric ID.
 */
export class CrudClient<
  TEntity,
  TCreateRequest,
  TUpdateRequest = TCreateRequest,
> extends BaseClient {
  constructor(
    config: ClientConfig,
    protected readonly resourcePath: string,
  ) {
    super(config);
  }

  async getAll(): Promise<TEntity[]> {
    return this.request('GET', `/${this.resourcePath}`);
  }

  async getById(id: number): Promise<TEntity> {
    return this.request('GET', `/${this.resourcePath}/${id}`);
  }

  async create(request: TCreateRequest): Promise<TEntity> {
    return this.request('POST', `/${this.resourcePath}`, { body: request });
  }

  async update(id: number, request: TUpdateRequest): Promise<TEntity> {
    return this.request('PUT', `/${this.resourcePath}/${id}`, { body: request });
  }

  async delete(id: number): Promise<void> {
    return this.request('DELETE', `/${this.resourcePath}/${id}`);
  }
}
