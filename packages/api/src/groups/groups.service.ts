import { Injectable } from '@nestjs/common';
import type { Group } from '@sales-planner/shared';
import { BaseEntityService } from '../common/index.js';
import { DatabaseService } from '../database/index.js';
import { normalizeCode } from '../lib/index.js';
import type { CreateGroupDto, ImportGroupItem, UpdateGroupDto } from './groups.schema.js';
import { ImportGroupItemSchema } from './groups.schema.js';

export type { Group };

@Injectable()
export class GroupsService extends BaseEntityService<
  Group,
  CreateGroupDto,
  UpdateGroupDto,
  ImportGroupItem
> {
  constructor(db: DatabaseService) {
    super(db, 'groups');
  }

  protected normalizeCode(code: string): string {
    return normalizeCode(code);
  }

  protected validateImportItem(item: unknown) {
    return ImportGroupItemSchema.safeParse(item);
  }
}
