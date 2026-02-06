import { Injectable } from '@nestjs/common';
import type { Group } from '@sales-planner/shared';
import { CodedShopScopedEntityService } from '../../common/index.js';
import { GroupsRepository } from './groups.repository.js';
import type { CreateGroupDto, ImportGroupItem, UpdateGroupDto } from './groups.schema.js';
import { ImportGroupItemSchema } from './groups.schema.js';

export type { Group };

@Injectable()
export class GroupsService extends CodedShopScopedEntityService<
  Group,
  CreateGroupDto,
  UpdateGroupDto,
  ImportGroupItem
> {
  constructor(repository: GroupsRepository) {
    super(repository, 'group', ImportGroupItemSchema);
  }
}
