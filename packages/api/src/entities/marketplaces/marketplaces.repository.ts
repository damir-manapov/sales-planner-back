import { Injectable } from '@nestjs/common';
import type {
  CreateMarketplaceDto,
  Marketplace,
  UpdateMarketplaceDto,
} from '@sales-planner/shared';
import { CodedShopScopedRepository } from '../../common/index.js';
import { DatabaseService, USER_QUERYABLE_TABLES } from '../../database/index.js';

@Injectable()
export class MarketplacesRepository extends CodedShopScopedRepository<
  Marketplace,
  CreateMarketplaceDto,
  UpdateMarketplaceDto
> {
  constructor(db: DatabaseService) {
    super(db, 'marketplaces', USER_QUERYABLE_TABLES);
  }
}
