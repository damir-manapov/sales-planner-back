import { Controller } from '@nestjs/common';
import type { CategoryExportItem } from '@sales-planner/shared';
import { BaseExamplesController } from '../../common/index.js';

const EXAMPLE_BRANDS: CategoryExportItem[] = [
  { code: 'apple', title: 'Apple' },
  { code: 'samsung', title: 'Samsung' },
  { code: 'dell', title: 'Dell' },
];

@Controller('categories/examples')
export class CategoriesExamplesController extends BaseExamplesController<CategoryExportItem> {
  protected readonly examples = EXAMPLE_BRANDS;
  protected readonly entityName = 'categories';
  protected readonly csvColumns = ['code', 'title'] as const;
}
