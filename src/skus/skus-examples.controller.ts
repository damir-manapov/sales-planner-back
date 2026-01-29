import { Controller, Get, Header } from '@nestjs/common';

const EXAMPLE_SKUS = [
  { code: 'SKU-001', title: 'Product 1' },
  { code: 'SKU-002', title: 'Product 2' },
  { code: 'SKU-003', title: 'Product 3' },
];

@Controller('skus/examples')
export class SkusExamplesController {
  @Get('json')
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="skus-example.json"')
  getJsonExample(): { code: string; title: string }[] {
    return EXAMPLE_SKUS;
  }

  @Get('csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="skus-example.csv"')
  getCsvExample(): string {
    const header = 'code,title';
    const rows = EXAMPLE_SKUS.map((sku) => `${sku.code},${sku.title}`);
    return [header, ...rows].join('\n');
  }
}
