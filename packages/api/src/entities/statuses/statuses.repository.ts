import { Injectable } from '@nestjs/common';
import type { CreateStatusDto, Status, UpdateStatusDto } from '@sales-planner/shared';
import { CodedShopScopedRepository } from '../../common/index.js';
import { DatabaseService, USER_QUERYABLE_TABLES } from '../../database/index.js';

@Injectable()
export class StatusesRepository extends CodedShopScopedRepository<Status, CreateStatusDto, UpdateStatusDto> {
  constructor(db: DatabaseService) {
    super(db, 'statuses', USER_QUERYABLE_TABLES);
  }
}
