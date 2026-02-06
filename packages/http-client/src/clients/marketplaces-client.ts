import type {
  Marketplace,
  CreateMarketplaceRequest,
  UpdateMarketplaceRequest,
  ImportMarketplaceItem,
  MarketplaceExportItem,
} from '@sales-planner/shared';
import type { ClientConfig } from './base-client.js';
import { CodedEntityClient } from './coded-entity-client.js';

export class MarketplacesClient extends CodedEntityClient<
  Marketplace,
  CreateMarketplaceRequest,
  UpdateMarketplaceRequest,
  ImportMarketplaceItem,
  MarketplaceExportItem
> {
  constructor(config: ClientConfig) {
    super(config, 'marketplaces');
  }
}
