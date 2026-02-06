import type { CodedTitledItem } from '../dto/base';

export interface SkuExportItem {
  code: string;
  title: string;
  title2?: string;
  category?: string;
  group?: string;
  status?: string;
  supplier?: string;
}

export type BrandExportItem = CodedTitledItem;

export type CategoryExportItem = CodedTitledItem;

export type GroupExportItem = CodedTitledItem;

export type StatusExportItem = CodedTitledItem;

export type SupplierExportItem = CodedTitledItem;

export type MarketplaceExportItem = CodedTitledItem;

export interface SalesHistoryExportItem {
  marketplace: string;
  period: string;
  sku: string;
  quantity: number;
}
