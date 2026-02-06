import { Injectable } from '@nestjs/common';
import type { CreateGroupDto, Group, UpdateGroupDto } from '@sales-planner/shared';
import { CodedShopScopedRepository } from '../../common/index.js';
import { DatabaseService, USER_QUERYABLE_TABLES } from '../../database/index.js';

@Injectable()
export class GroupsRepository extends CodedShopScopedRepository<
  Group,
  CreateGroupDto,
  UpdateGroupDto
> {
  constructor(db: DatabaseService) {
    super(db, 'groups', USER_QUERYABLE_TABLES);
  }
}
