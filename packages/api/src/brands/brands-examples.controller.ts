import { Controller } from '@nestjs/common';
import type { BrandExportItem } from '@sales-planner/shared';
import { BaseExamplesController } from '../common/index.js';

const EXAMPLE_BRANDS: BrandExportItem[] = [
  { code: 'apple', title: 'Apple' },
  { code: 'samsung', title: 'Samsung' },
  { code: 'dell', title: 'Dell' },
];

@Controller('brands/examples')
export class BrandsExamplesController extends BaseExamplesController<BrandExportItem> {
  protected readonly examples = EXAMPLE_BRANDS;
  protected readonly entityName = 'brands';
  protected readonly csvColumns = ['code', 'title'] as const;
}
