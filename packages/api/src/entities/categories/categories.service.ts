import { Injectable } from '@nestjs/common';
import type { Category } from '@sales-planner/shared';
import { CodedShopScopedEntityService } from '../../common/index.js';
import { CategoriesRepository } from './categories.repository.js';
import type {
  CreateCategoryDto,
  ImportCategoryItem,
  UpdateCategoryDto,
} from './categories.schema.js';
import { ImportCategoryItemSchema } from './categories.schema.js';

export type { Category };

@Injectable()
export class CategoriesService extends CodedShopScopedEntityService<
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  ImportCategoryItem
> {
  constructor(repository: CategoriesRepository) {
    super(repository, 'category', ImportCategoryItemSchema);
  }
}
