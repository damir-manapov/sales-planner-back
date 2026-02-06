import { Injectable } from '@nestjs/common';
import type { Supplier } from '@sales-planner/shared';
import { CodedShopScopedEntityService } from '../../common/index.js';
import { SuppliersRepository } from './suppliers.repository.js';
import type {
  CreateSupplierDto,
  ImportSupplierItem,
  UpdateSupplierDto,
} from './suppliers.schema.js';
import { ImportSupplierItemSchema } from './suppliers.schema.js';

export type { Supplier };

@Injectable()
export class SuppliersService extends CodedShopScopedEntityService<
  Supplier,
  CreateSupplierDto,
  UpdateSupplierDto,
  ImportSupplierItem
> {
  constructor(repository: SuppliersRepository) {
    super(repository, 'supplier', ImportSupplierItemSchema);
  }
}
