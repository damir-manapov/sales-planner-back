import { Controller } from '@nestjs/common';
import type { StatusExportItem } from '@sales-planner/shared';
import { BaseExamplesController } from '../common/index.js';

const EXAMPLE_BRANDS: StatusExportItem[] = [
  { code: 'apple', title: 'Apple' },
  { code: 'samsung', title: 'Samsung' },
  { code: 'dell', title: 'Dell' },
];

@Controller('statuses/examples')
export class StatusesExamplesController extends BaseExamplesController<StatusExportItem> {
  protected readonly examples = EXAMPLE_BRANDS;
  protected readonly entityName = 'statuses';
  protected readonly csvColumns = ['code', 'title'] as const;
}
