import { Injectable } from '@nestjs/common';
import type { CreateWarehouseDto, Warehouse, UpdateWarehouseDto } from '@sales-planner/shared';
import { CodedShopScopedRepository } from '../../common/index.js';
import { DatabaseService, USER_QUERYABLE_TABLES } from '../../database/index.js';

@Injectable()
export class WarehousesRepository extends CodedShopScopedRepository<
  Warehouse,
  CreateWarehouseDto,
  UpdateWarehouseDto
> {
  constructor(db: DatabaseService) {
    super(db, 'warehouses', USER_QUERYABLE_TABLES);
  }
}
