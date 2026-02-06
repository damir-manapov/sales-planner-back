import { Controller } from '@nestjs/common';
import type { SalesHistoryExportItem } from '@sales-planner/shared';
import { BaseExamplesController } from '../../common/index.js';

const EXAMPLE_SALES_HISTORY: SalesHistoryExportItem[] = [
  { marketplace: 'WB', period: '2026-01', sku: 'SKU-001', quantity: 100 },
  { marketplace: 'WB', period: '2026-02', sku: 'SKU-001', quantity: 120 },
  { marketplace: 'OZON', period: '2026-01', sku: 'SKU-002', quantity: 50 },
];

@Controller('sales-history/examples')
export class SalesHistoryExamplesController extends BaseExamplesController<SalesHistoryExportItem> {
  protected readonly examples = EXAMPLE_SALES_HISTORY;
  protected readonly entityName = 'sales-history';
  protected readonly csvColumns = ['marketplace', 'period', 'sku', 'quantity'] as const;
}
