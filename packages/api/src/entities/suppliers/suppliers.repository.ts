import { Injectable } from '@nestjs/common';
import type { CreateSupplierDto, Supplier, UpdateSupplierDto } from '@sales-planner/shared';
import { CodedShopScopedRepository } from '../../common/index.js';
import { DatabaseService, USER_QUERYABLE_TABLES } from '../../database/index.js';

@Injectable()
export class SuppliersRepository extends CodedShopScopedRepository<Supplier, CreateSupplierDto, UpdateSupplierDto> {
  constructor(db: DatabaseService) {
    super(db, 'suppliers', USER_QUERYABLE_TABLES);
  }
}
