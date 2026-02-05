export interface SkuExportItem {
  code: string;
  title: string;
}

export interface BrandExportItem {
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
