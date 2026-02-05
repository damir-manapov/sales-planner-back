export interface SkuExportItem {
  code: string;
  title: string;
  category_code?: string;
  group_code?: string;
  status_code?: string;
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
