import type {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  ImportSupplierItem,
  SupplierExportItem,
} from '@sales-planner/shared';
import type { ClientConfig } from './base-client.js';
import { CodedEntityClient } from './coded-entity-client.js';

export class SuppliersClient extends CodedEntityClient<
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  ImportSupplierItem,
  SupplierExportItem
> {
  constructor(config: ClientConfig) {
    super(config, 'suppliers');
  }
}
