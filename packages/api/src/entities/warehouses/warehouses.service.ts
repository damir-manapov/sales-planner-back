import { Injectable } from '@nestjs/common';
import type { Warehouse } from '@sales-planner/shared';
import { CodedShopScopedEntityService } from '../../common/index.js';
import { WarehousesRepository } from './warehouses.repository.js';
import type {
  CreateWarehouseDto,
  ImportWarehouseItem,
  UpdateWarehouseDto,
} from './warehouses.schema.js';
import { ImportWarehouseItemSchema } from './warehouses.schema.js';

export type { Warehouse };

@Injectable()
export class WarehousesService extends CodedShopScopedEntityService<
  Warehouse,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  ImportWarehouseItem
> {
  constructor(repository: WarehousesRepository) {
    super(repository, 'warehouse', ImportWarehouseItemSchema);
  }
}
