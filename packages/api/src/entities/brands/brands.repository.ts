import { Injectable } from '@nestjs/common';
import type { Brand, CreateBrandDto, UpdateBrandDto } from '@sales-planner/shared';
import { CodedShopScopedRepository } from '../../common/index.js';
import { DatabaseService, USER_QUERYABLE_TABLES } from '../../database/index.js';

@Injectable()
export class BrandsRepository extends CodedShopScopedRepository<
  Brand,
  CreateBrandDto,
  UpdateBrandDto
> {
  constructor(db: DatabaseService) {
    super(db, 'brands', USER_QUERYABLE_TABLES);
  }
}
