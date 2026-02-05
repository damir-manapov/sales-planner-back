import type {
  Status,
  CreateStatusRequest,
  UpdateStatusRequest,
  ImportStatusItem,
  StatusExportItem,
  ImportResult,
  ShopContextParams,
} from '@sales-planner/shared';
import { ImportExportBaseClient } from './import-export-base-client.js';

export class StatusesClient extends ImportExportBaseClient {
  async getStatuses(ctx: ShopContextParams): Promise<Status[]> {
    return this.request('GET', '/statuses', { params: ctx });
  }

  async getStatus(ctx: ShopContextParams, id: number): Promise<Status> {
    return this.request('GET', `/statuses/${id}`, { params: ctx });
  }

  async getStatusByCode(ctx: ShopContextParams, code: string): Promise<Status> {
    return this.request('GET', `/statuses/code/${encodeURIComponent(code)}`, { params: ctx });
  }

  async createStatus(ctx: ShopContextParams, request: CreateStatusRequest): Promise<Status> {
    return this.request('POST', '/statuses', { body: request, params: ctx });
  }

  async updateStatus(
    ctx: ShopContextParams,
    id: number,
    request: UpdateStatusRequest,
  ): Promise<Status> {
    return this.request('PUT', `/statuses/${id}`, { body: request, params: ctx });
  }

  async deleteStatus(ctx: ShopContextParams, id: number): Promise<void> {
    return this.request('DELETE', `/statuses/${id}`, { params: ctx });
  }

  // Import/Export methods
  async importJson(ctx: ShopContextParams, items: ImportStatusItem[]): Promise<ImportResult> {
    return this.request('POST', '/statuses/import/json', { body: items, params: ctx });
  }

  async importCsv(ctx: ShopContextParams, csvContent: string): Promise<ImportResult> {
    return this.uploadCsv('/statuses/import/csv', csvContent, ctx);
  }

  async exportJson(ctx: ShopContextParams): Promise<StatusExportItem[]> {
    return this.request('GET', '/statuses/export/json', { params: ctx });
  }

  async exportCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', '/statuses/export/csv', { params: ctx });
  }

  async getExampleJson(): Promise<StatusExportItem[]> {
    return this.requestPublic('GET', '/statuses/examples/json');
  }

  async getExampleCsv(): Promise<string> {
    return this.requestTextPublic('GET', '/statuses/examples/csv');
  }
}
