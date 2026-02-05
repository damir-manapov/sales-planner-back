import { Controller } from '@nestjs/common';
import type { SkuExportItem } from '@sales-planner/shared';
import { BaseExamplesController } from '../common/index.js';

const EXAMPLE_SKUS: SkuExportItem[] = [
  { code: 'SKU-001', title: 'Product 1' },
  { code: 'SKU-002', title: 'Product 2' },
  { code: 'SKU-003', title: 'Product 3' },
];

@Controller('skus/examples')
export class SkusExamplesController extends BaseExamplesController<SkuExportItem> {
  protected readonly examples = EXAMPLE_SKUS;
  protected readonly entityName = 'skus';
  protected readonly csvColumns = ['code', 'title'] as const;
}
