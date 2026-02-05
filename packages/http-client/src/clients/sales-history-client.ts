import type {
  SalesHistory,
  CreateSalesHistoryRequest,
  UpdateSalesHistoryDto,
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

  async getSalesHistoryItem(id: number, ctx: ShopContextParams): Promise<SalesHistory> {
    return this.request('GET', `/sales-history/${id}`, { params: ctx });
  }

  async createSalesHistory(
    dto: CreateSalesHistoryRequest,
    ctx: ShopContextParams,
  ): Promise<SalesHistory> {
    return this.request('POST', '/sales-history', { body: dto, params: ctx });
  }

  async updateSalesHistory(
    id: number,
    dto: UpdateSalesHistoryDto,
    ctx: ShopContextParams,
  ): Promise<SalesHistory> {
    return this.request('PUT', `/sales-history/${id}`, { body: dto, params: ctx });
  }

  async deleteSalesHistory(id: number, ctx: ShopContextParams): Promise<void> {
    return this.request('DELETE', `/sales-history/${id}`, { params: ctx });
  }

  async importSalesHistoryJson(
    items: ImportSalesHistoryItem[],
    ctx: ShopContextParams,
  ): Promise<SalesHistoryImportResult> {
    return this.request('POST', '/sales-history/import/json', { body: items, params: ctx });
  }

  async importSalesHistoryCsv(
    csvContent: string,
    ctx: ShopContextParams,
  ): Promise<SalesHistoryImportResult> {
    return this.uploadCsv('/sales-history/import/csv', csvContent, ctx);
  }

  async exportSalesHistoryJson(
    ctx: ShopContextParams,
    query?: PeriodQuery,
  ): Promise<SalesHistoryExportItem[]> {
    return this.request('GET', '/sales-history/export/json', { params: { ...ctx, ...query } });
  }

  async exportSalesHistoryCsv(ctx: ShopContextParams, query?: PeriodQuery): Promise<string> {
    return this.requestText('GET', '/sales-history/export/csv', { params: { ...ctx, ...query } });
  }

  async getSalesHistoryExampleJson(): Promise<ImportSalesHistoryItem[]> {
    return this.requestPublic('GET', '/sales-history/examples/json');
  }

  async getSalesHistoryExampleCsv(): Promise<string> {
    return this.requestTextPublic('GET', '/sales-history/examples/csv');
  }
}
