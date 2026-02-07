export interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

export interface SkuImportResult extends ImportResult {
  categories_created: number;
  groups_created: number;
  statuses_created: number;
  suppliers_created: number;
}

export interface SalesHistoryImportResult extends ImportResult {
  skus_created: number;
  marketplaces_created: number;
}

export interface DeleteDataResult {
  skusDeleted: number;
  salesHistoryDeleted: number;
  marketplacesDeleted: number;
  brandsDeleted: number;
  categoriesDeleted: number;
  groupsDeleted: number;
  statusesDeleted: number;
  suppliersDeleted: number;
  warehousesDeleted: number;
}
