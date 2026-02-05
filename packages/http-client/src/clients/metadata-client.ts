import type { EntitiesMetadata } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

export class MetadataClient extends BaseClient {
  /**
   * Get entities metadata for UI documentation
   * @returns Metadata describing all entities and their fields
   */
  async getEntitiesMetadata(): Promise<EntitiesMetadata> {
    return this.request<EntitiesMetadata>('GET', '/metadata/entities');
  }
}
