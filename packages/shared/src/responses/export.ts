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
  sku_code: string;
  period: string;
  quantity: number;
  marketplace: string;
}
