export interface SkuExportItem {
  code: string;
  title: string;
  title2?: string;
  category?: string;
  group?: string;
  status?: string;
  supplier?: string;
}

export interface BrandExportItem {
  code: string;
  title: string;
}

export interface CategoryExportItem {
  code: string;
  title: string;
}

export interface GroupExportItem {
  code: string;
  title: string;
}

export interface StatusExportItem {
  code: string;
  title: string;
}

export interface SupplierExportItem {
  code: string;
  title: string;
}

export interface MarketplaceExportItem {
  code: string;
  title: string;
}

export interface SalesHistoryExportItem {
  marketplace: string;
  period: string;
  sku: string;
  quantity: number;
}
