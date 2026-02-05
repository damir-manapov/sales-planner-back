import { Injectable } from '@nestjs/common';
import type { Brand } from '@sales-planner/shared';
import { BaseEntityService } from '../common/index.js';
import { DatabaseService } from '../database/index.js';
import { normalizeId } from '../lib/index.js';
import type { CreateBrandDto, ImportBrandItem, UpdateBrandDto } from './brands.schema.js';
import { ImportBrandItemSchema } from './brands.schema.js';

export type { Brand };

@Injectable()
export class BrandsService extends BaseEntityService<
  Brand,
  CreateBrandDto,
  UpdateBrandDto,
  ImportBrandItem
> {
  constructor(db: DatabaseService) {
    super(db, 'brands');
  }

  protected normalizeCode(code: string): string {
    return normalizeId(code);
  }

  protected validateImportItem(item: unknown) {
    return ImportBrandItemSchema.safeParse(item);
  }
}
