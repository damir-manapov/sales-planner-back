import { Controller } from '@nestjs/common';
import type { SalesHistoryExportItem } from '@sales-planner/shared';
import { BaseExamplesController } from '../common/index.js';

const EXAMPLE_SALES_HISTORY: SalesHistoryExportItem[] = [
  { sku_code: 'SKU-001', period: '2026-01', quantity: 100, marketplace: 'WB' },
  { sku_code: 'SKU-001', period: '2026-02', quantity: 120, marketplace: 'WB' },
  { sku_code: 'SKU-002', period: '2026-01', quantity: 50, marketplace: 'OZON' },
];

@Controller('sales-history/examples')
export class SalesHistoryExamplesController extends BaseExamplesController<SalesHistoryExportItem> {
  protected readonly examples = EXAMPLE_SALES_HISTORY;
  protected readonly entityName = 'sales-history';
  protected readonly csvColumns = ['sku_code', 'period', 'quantity', 'marketplace'] as const;
}
