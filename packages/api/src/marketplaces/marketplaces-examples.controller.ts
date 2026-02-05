import { Controller } from '@nestjs/common';
import type { MarketplaceExportItem } from '@sales-planner/shared';
import { BaseExamplesController } from '../common/index.js';

const EXAMPLE_MARKETPLACES: MarketplaceExportItem[] = [
  { code: 'wb', title: 'Wildberries' },
  { code: 'ozon', title: 'Ozon' },
  { code: 'ym', title: 'Yandex Market' },
];

@Controller('marketplaces/examples')
export class MarketplacesExamplesController extends BaseExamplesController<MarketplaceExportItem> {
  protected readonly examples = EXAMPLE_MARKETPLACES;
  protected readonly entityName = 'marketplaces';
  protected readonly csvColumns = ['code', 'title'] as const;
}
