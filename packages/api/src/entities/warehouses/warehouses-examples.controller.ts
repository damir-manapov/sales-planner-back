import { Controller } from '@nestjs/common';
import type { WarehouseExportItem } from '@sales-planner/shared';
import { BaseExamplesController } from '../../common/index.js';

const EXAMPLE_WAREHOUSES: WarehouseExportItem[] = [
  { code: 'main', title: 'Main Warehouse' },
  { code: 'ozon', title: 'Ozon FBS' },
  { code: 'wb', title: 'Wildberries FBS' },
];

@Controller('warehouses/examples')
export class WarehousesExamplesController extends BaseExamplesController<WarehouseExportItem> {
  protected readonly examples = EXAMPLE_WAREHOUSES;
  protected readonly entityName = 'warehouses';
  protected readonly csvColumns = ['code', 'title'] as const;
}
