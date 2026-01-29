import { Controller, Get, Header } from '@nestjs/common';

const EXAMPLE_SALES_HISTORY = [
  { sku_code: 'SKU-001', period: '2026-01', quantity: 100, amount: '1500.50' },
  { sku_code: 'SKU-001', period: '2026-02', quantity: 120, amount: '1800.00' },
  { sku_code: 'SKU-002', period: '2026-01', quantity: 50, amount: '750.00' },
];

@Controller('sales-history/examples')
export class SalesHistoryExamplesController {
  @Get('json')
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="sales-history-example.json"')
  getJsonExample(): { sku_code: string; period: string; quantity: number; amount: string }[] {
    return EXAMPLE_SALES_HISTORY;
  }

  @Get('csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="sales-history-example.csv"')
  getCsvExample(): string {
    const header = 'sku_code,period,quantity,amount';
    const rows = EXAMPLE_SALES_HISTORY.map(
      (item) => `${item.sku_code},${item.period},${item.quantity},${item.amount}`,
    );
    return [header, ...rows].join('\n');
  }
}
