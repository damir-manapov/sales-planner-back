import { Injectable } from '@nestjs/common';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@sales-planner/shared';
import { CodedShopScopedRepository } from '../../common/index.js';
import { DatabaseService, USER_QUERYABLE_TABLES } from '../../database/index.js';

@Injectable()
export class CategoriesRepository extends CodedShopScopedRepository<Category, CreateCategoryDto, UpdateCategoryDto> {
  constructor(db: DatabaseService) {
    super(db, 'categories', USER_QUERYABLE_TABLES);
  }
}
