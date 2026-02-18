export interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

export interface SkuImportResult extends ImportResult {
  categoriesCreated: number;
  groupsCreated: number;
  statusesCreated: number;
  suppliersCreated: number;
}

export interface SalesHistoryImportResult extends ImportResult {
  skusCreated: number;
  marketplacesCreated: number;
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
  leftoversDeleted: number;
  seasonalCoefficientsDeleted: number;
  skuCompetitorMappingsDeleted: number;
  competitorSalesDeleted: number;
  competitorProductsDeleted: number;
}
