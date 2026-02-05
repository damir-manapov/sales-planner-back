import { Injectable } from '@nestjs/common';
import type { Category } from '@sales-planner/shared';
import { BaseEntityService } from '../common/index.js';
import { DatabaseService } from '../database/index.js';
import { normalizeCode } from '../lib/index.js';
import type {
  CreateCategoryDto,
  ImportCategoryItem,
  UpdateCategoryDto,
} from './categories.schema.js';
import { ImportCategoryItemSchema } from './categories.schema.js';

export type { Category };

@Injectable()
export class CategoriesService extends BaseEntityService<
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  ImportCategoryItem
> {
  constructor(db: DatabaseService) {
    super(db, 'categories');
  }

  protected normalizeCode(code: string): string {
    return normalizeCode(code);
  }

  protected validateImportItem(item: unknown) {
    return ImportCategoryItemSchema.safeParse(item);
  }
}
