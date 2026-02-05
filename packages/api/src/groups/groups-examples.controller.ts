import { Controller } from '@nestjs/common';
import type { GroupExportItem } from '@sales-planner/shared';
import { BaseExamplesController } from '../common/index.js';

const EXAMPLE_BRANDS: GroupExportItem[] = [
  { code: 'apple', title: 'Apple' },
  { code: 'samsung', title: 'Samsung' },
  { code: 'dell', title: 'Dell' },
];

@Controller('groups/examples')
export class GroupsExamplesController extends BaseExamplesController<GroupExportItem> {
  protected readonly examples = EXAMPLE_BRANDS;
  protected readonly entityName = 'groups';
  protected readonly csvColumns = ['code', 'title'] as const;
}
