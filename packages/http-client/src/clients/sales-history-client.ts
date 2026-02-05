import type {
  SalesHistory,
  CreateSalesHistoryRequest,
  UpdateSalesHistoryRequest,
  ImportSalesHistoryItem,
  SalesHistoryExportItem,
  SalesHistoryImportResult,
  PeriodQuery,
  ShopContextParams,
} from '@sales-planner/shared';
import { ImportExportBaseClient } from './import-export-base-client.js';

export class SalesHistoryClient extends ImportExportBaseClient {
  async getSalesHistory(ctx: ShopContextParams, query?: PeriodQuery): Promise<SalesHistory[]> {
    return this.request('GET', '/sales-history', { params: { ...ctx, ...query } });
  }

  async getSalesHistoryItem(ctx: ShopContextParams, id: number): Promise<SalesHistory> {
    return this.request('GET', `/sales-history/${id}`, { params: ctx });
  }

  async createSalesHistory(
    ctx: ShopContextParams,
    request: CreateSalesHistoryRequest,
  ): Promise<SalesHistory> {
    return this.request('POST', '/sales-history', { body: request, params: ctx });
  }

  async updateSalesHistory(
    ctx: ShopContextParams,
    id: number,
    request: UpdateSalesHistoryRequest,
  ): Promise<SalesHistory> {
    return this.request('PUT', `/sales-history/${id}`, { body: request, params: ctx });
  }

  async deleteSalesHistory(ctx: ShopContextParams, id: number): Promise<void> {
    return this.request('DELETE', `/sales-history/${id}`, { params: ctx });
  }

  async importJson(
    ctx: ShopContextParams,
    items: ImportSalesHistoryItem[],
  ): Promise<SalesHistoryImportResult> {
    return this.request('POST', '/sales-history/import/json', { body: items, params: ctx });
  }

  async importCsv(ctx: ShopContextParams, csvContent: string): Promise<SalesHistoryImportResult> {
    return this.uploadCsv('/sales-history/import/csv', csvContent, ctx);
  }

  async exportJson(ctx: ShopContextParams, query?: PeriodQuery): Promise<SalesHistoryExportItem[]> {
    return this.request('GET', '/sales-history/export/json', { params: { ...ctx, ...query } });
  }

  async exportCsv(ctx: ShopContextParams, query?: PeriodQuery): Promise<string> {
    return this.requestText('GET', '/sales-history/export/csv', { params: { ...ctx, ...query } });
  }

  async getExampleJson(): Promise<ImportSalesHistoryItem[]> {
    return this.requestPublic('GET', '/sales-history/examples/json');
  }

  async getExampleCsv(): Promise<string> {
    return this.requestTextPublic('GET', '/sales-history/examples/csv');
  }
}
