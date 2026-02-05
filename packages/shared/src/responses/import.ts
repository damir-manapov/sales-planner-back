export interface ImportResult {
  created: number;
  updated: number;
  skus_created?: number;
  marketplaces_created?: number;
  errors: string[];
}

export interface DeleteDataResult {
  skusDeleted: number;
  salesHistoryDeleted: number;
  marketplacesDeleted: number;
}
