import { Controller, Get, Header } from '@nestjs/common';
import type { MarketplaceExportItem } from '@sales-planner/shared';
import { toCsv } from '../lib/index.js';

const EXAMPLE_MARKETPLACES: MarketplaceExportItem[] = [
  { id: 'wb', title: 'Wildberries' },
  { id: 'ozon', title: 'Ozon' },
  { id: 'ym', title: 'Yandex Market' },
];

@Controller('marketplaces/examples')
export class MarketplacesExamplesController {
  @Get('json')
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="marketplaces-example.json"')
  getJsonExample(): MarketplaceExportItem[] {
    return EXAMPLE_MARKETPLACES;
  }

  @Get('csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="marketplaces-example.csv"')
  getCsvExample(): string {
    return toCsv(EXAMPLE_MARKETPLACES, ['id', 'title']);
  }
}
