import { Injectable } from '@nestjs/common';
import type { Status } from '@sales-planner/shared';
import { CodedShopScopedEntityService } from '../../common/index.js';
import { StatusesRepository } from './statuses.repository.js';
import type { CreateStatusDto, ImportStatusItem, UpdateStatusDto } from './statuses.schema.js';
import { ImportStatusItemSchema } from './statuses.schema.js';

export type { Status };

@Injectable()
export class StatusesService extends CodedShopScopedEntityService<
  Status,
  CreateStatusDto,
  UpdateStatusDto,
  ImportStatusItem
> {
  constructor(repository: StatusesRepository) {
    super(repository, 'status', ImportStatusItemSchema);
  }
}
