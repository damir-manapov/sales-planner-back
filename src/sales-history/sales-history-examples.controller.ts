import { Controller, Get, Header } from '@nestjs/common';

const EXAMPLE_SALES_HISTORY = [
  { sku_code: 'SKU-001', period: '2026-01', quantity: 100 },
  { sku_code: 'SKU-001', period: '2026-02', quantity: 120 },
  { sku_code: 'SKU-002', period: '2026-01', quantity: 50 },
];

@Controller('sales-history/examples')
export class SalesHistoryExamplesController {
  @Get('json')
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="sales-history-example.json"')
  getJsonExample(): { sku_code: string; period: string; quantity: number }[] {
    return EXAMPLE_SALES_HISTORY;
  }

  @Get('csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="sales-history-example.csv"')
  getCsvExample(): string {
    const header = 'sku_code,period,quantity';
    const rows = EXAMPLE_SALES_HISTORY.map(
      (item) => `${item.sku_code},${item.period},${item.quantity}`,
    );
    return [header, ...rows].join('\n');
  }
}
