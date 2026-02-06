import type {
  Brand,
  CreateBrandRequest,
  UpdateBrandRequest,
  ImportBrandItem,
  BrandExportItem,
} from '@sales-planner/shared';
import type { ClientConfig } from './base-client.js';
import { CodedEntityClient } from './coded-entity-client.js';

export class BrandsClient extends CodedEntityClient<
  Brand,
  CreateBrandRequest,
  UpdateBrandRequest,
  ImportBrandItem,
  BrandExportItem
> {
  constructor(config: ClientConfig) {
    super(config, 'brands');
  }
}

