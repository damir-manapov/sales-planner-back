import { Controller, Get, Header } from '@nestjs/common';
import { toCsv } from '../lib/index.js';

const EXAMPLE_SALES_HISTORY = [
  { sku_code: 'SKU-001', period: '2026-01', quantity: 100, marketplace: 'WB' },
  { sku_code: 'SKU-001', period: '2026-02', quantity: 120, marketplace: 'WB' },
  { sku_code: 'SKU-002', period: '2026-01', quantity: 50, marketplace: 'OZON' },
];

@Controller('sales-history/examples')
export class SalesHistoryExamplesController {
  @Get('json')
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="sales-history-example.json"')
  getJsonExample(): { sku_code: string; period: string; quantity: number; marketplace: string }[] {
    return EXAMPLE_SALES_HISTORY;
  }

  @Get('csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="sales-history-example.csv"')
  getCsvExample(): string {
    return toCsv(EXAMPLE_SALES_HISTORY, ['sku_code', 'period', 'quantity', 'marketplace']);
  }
}
