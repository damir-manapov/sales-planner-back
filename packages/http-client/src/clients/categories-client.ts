import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ImportCategoryItem,
  CategoryExportItem,
} from '@sales-planner/shared';
import type { ClientConfig } from './base-client.js';
import { CodedEntityClient } from './coded-entity-client.js';

export class CategoriesClient extends CodedEntityClient<
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ImportCategoryItem,
  CategoryExportItem
> {
  constructor(config: ClientConfig) {
    super(config, 'categories');
  }
}

