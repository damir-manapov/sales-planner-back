import { Injectable } from '@nestjs/common';
import type { Brand } from '@sales-planner/shared';
import { CodedShopScopedEntityService } from '../../common/index.js';
import { BrandsRepository } from './brands.repository.js';
import type { CreateBrandDto, ImportBrandItem, UpdateBrandDto } from './brands.schema.js';
import { ImportBrandItemSchema } from './brands.schema.js';

export type { Brand };

@Injectable()
export class BrandsService extends CodedShopScopedEntityService<
  Brand,
  CreateBrandDto,
  UpdateBrandDto,
  ImportBrandItem
> {
  constructor(repository: BrandsRepository) {
    super(repository, 'brand', ImportBrandItemSchema);
  }
}
