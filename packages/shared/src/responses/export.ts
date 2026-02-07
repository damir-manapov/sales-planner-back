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

export type WarehouseExportItem = CodedTitledItem;

export type MarketplaceExportItem = CodedTitledItem;

export interface SalesHistoryExportItem {
  marketplace: string;
  period: string;
  sku: string;
  quantity: number;
}

export interface LeftoverExportItem {
  warehouse: string;
  sku: string;
  period: string;
  quantity: number;
}

export interface SeasonalCoefficientExportItem {
  group: string;
  month: number;
  coefficient: number;
}

export interface CompetitorProductExportItem {
  marketplace: string;
  marketplace_product_id: string; // BIGINT as string
  title?: string;
  brand?: string;
}

export interface SkuCompetitorMappingExportItem {
  sku: string;
  marketplace: string;
  marketplace_product_id: string; // BIGINT as string
}

export interface CompetitorSaleExportItem {
  marketplace: string;
  marketplace_product_id: string; // BIGINT as string
  period: string;
  quantity: number;
}
