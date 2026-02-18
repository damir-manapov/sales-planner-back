import type {
  Brand,
  CreateBrandRequest,
  UpdateBrandRequest,
  ImportBrandItem,
  BrandExportItem,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ImportCategoryItem,
  CategoryExportItem,
  Group,
  CreateGroupRequest,
  UpdateGroupRequest,
  ImportGroupItem,
  GroupExportItem,
  Status,
  CreateStatusRequest,
  UpdateStatusRequest,
  ImportStatusItem,
  StatusExportItem,
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  ImportSupplierItem,
  SupplierExportItem,
  Warehouse,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  ImportWarehouseItem,
  WarehouseExportItem,
  Marketplace,
  CreateMarketplaceRequest,
  UpdateMarketplaceRequest,
  ImportMarketplaceItem,
  MarketplaceExportItem,
} from '@sales-planner/shared';
import { createCodedEntityHooks } from './create-coded-entity-hooks.js';

export const brands = createCodedEntityHooks<
  Brand,
  CreateBrandRequest,
  UpdateBrandRequest,
  ImportBrandItem,
  BrandExportItem
>('brands', (c) => c.brands);

export const categories = createCodedEntityHooks<
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ImportCategoryItem,
  CategoryExportItem
>('categories', (c) => c.categories);

export const groups = createCodedEntityHooks<
  Group,
  CreateGroupRequest,
  UpdateGroupRequest,
  ImportGroupItem,
  GroupExportItem
>('groups', (c) => c.groups);

export const statuses = createCodedEntityHooks<
  Status,
  CreateStatusRequest,
  UpdateStatusRequest,
  ImportStatusItem,
  StatusExportItem
>('statuses', (c) => c.statuses);

export const suppliers = createCodedEntityHooks<
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  ImportSupplierItem,
  SupplierExportItem
>('suppliers', (c) => c.suppliers);

export const warehouses = createCodedEntityHooks<
  Warehouse,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  ImportWarehouseItem,
  WarehouseExportItem
>('warehouses', (c) => c.warehouses);

export const marketplaces = createCodedEntityHooks<
  Marketplace,
  CreateMarketplaceRequest,
  UpdateMarketplaceRequest,
  ImportMarketplaceItem,
  MarketplaceExportItem
>('marketplaces', (c) => c.marketplaces);
