import { Injectable } from '@nestjs/common';
import type { Marketplace } from '@sales-planner/shared';
import { CodedShopScopedEntityService } from '../../common/index.js';
import { MarketplacesRepository } from './marketplaces.repository.js';
import type {
  CreateMarketplaceDto,
  ImportMarketplaceItem,
  UpdateMarketplaceDto,
} from './marketplaces.schema.js';
import { ImportMarketplaceItemSchema } from './marketplaces.schema.js';

export type { Marketplace };
export type { CreateMarketplaceDto, UpdateMarketplaceDto };

@Injectable()
export class MarketplacesService extends CodedShopScopedEntityService<
  Marketplace,
  CreateMarketplaceDto,
  UpdateMarketplaceDto,
  ImportMarketplaceItem
> {
  constructor(readonly marketplacesRepository: MarketplacesRepository) {
    super(marketplacesRepository, 'marketplace', ImportMarketplaceItemSchema);
  }
}
