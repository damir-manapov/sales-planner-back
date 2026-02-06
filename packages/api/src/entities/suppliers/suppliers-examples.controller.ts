import { Controller } from '@nestjs/common';
import type { SupplierExportItem } from '@sales-planner/shared';
import { BaseExamplesController } from '../../common/index.js';

const EXAMPLE_SUPPLIERS: SupplierExportItem[] = [
  { code: 'supplier1', title: 'Example Supplier 1' },
  { code: 'supplier2', title: 'Example Supplier 2' },
  { code: 'supplier3', title: 'Example Supplier 3' },
];

@Controller('suppliers/examples')
export class SuppliersExamplesController extends BaseExamplesController<SupplierExportItem> {
  protected readonly examples = EXAMPLE_SUPPLIERS;
  protected readonly entityName = 'suppliers';
  protected readonly csvColumns = ['code', 'title'] as const;
}
