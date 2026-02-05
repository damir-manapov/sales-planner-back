import { Injectable } from '@nestjs/common';
import type { Status } from '@sales-planner/shared';
import { BaseEntityService } from '../common/index.js';
import { DatabaseService } from '../database/index.js';
import { normalizeCode } from '../lib/index.js';
import type { CreateStatusDto, ImportStatusItem, UpdateStatusDto } from './statuses.schema.js';
import { ImportStatusItemSchema } from './statuses.schema.js';

export type { Status };

@Injectable()
export class StatusesService extends BaseEntityService<
  Status,
  CreateStatusDto,
  UpdateStatusDto,
  ImportStatusItem
> {
  constructor(db: DatabaseService) {
    super(db, 'statuses');
  }

  protected normalizeCode(code: string): string {
    return normalizeCode(code);
  }

  protected validateImportItem(item: unknown) {
    return ImportStatusItemSchema.safeParse(item);
  }
}
