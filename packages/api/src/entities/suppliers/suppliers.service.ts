import { Injectable } from '@nestjs/common';
import type { Supplier } from '@sales-planner/shared';
import { BaseEntityService } from '../../common/index.js';
import { DatabaseService } from '../../database/index.js';
import { normalizeCode } from '../../lib/index.js';
import type {
  CreateSupplierDto,
  ImportSupplierItem,
  UpdateSupplierDto,
} from './suppliers.schema.js';
import { ImportSupplierItemSchema } from './suppliers.schema.js';

export type { Supplier };

@Injectable()
export class SuppliersService extends BaseEntityService<
  Supplier,
  CreateSupplierDto,
  UpdateSupplierDto,
  ImportSupplierItem
> {
  constructor(db: DatabaseService) {
    super(db, 'suppliers');
  }

  protected normalizeCode(code: string): string {
    return normalizeCode(code);
  }

  protected validateImportItem(item: unknown) {
    return ImportSupplierItemSchema.safeParse(item);
  }
}
