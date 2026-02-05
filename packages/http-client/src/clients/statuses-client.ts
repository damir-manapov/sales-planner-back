import type {
  Status,
  CreateStatusRequest,
  UpdateStatusDto,
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

  async getStatus(id: number, ctx: ShopContextParams): Promise<Status> {
    return this.request('GET', `/statuses/${id}`, { params: ctx });
  }

  async createStatus(dto: CreateStatusRequest, ctx: ShopContextParams): Promise<Status> {
    return this.request('POST', '/statuses', { body: dto, params: ctx });
  }

  async updateStatus(id: number, dto: UpdateStatusDto, ctx: ShopContextParams): Promise<Status> {
    return this.request('PUT', `/statuses/${id}`, { body: dto, params: ctx });
  }

  async deleteStatus(id: number, ctx: ShopContextParams): Promise<void> {
    return this.request('DELETE', `/statuses/${id}`, { params: ctx });
  }

  // Import/Export methods
  async importStatusesJson(
    items: ImportStatusItem[],
    ctx: ShopContextParams,
  ): Promise<ImportResult> {
    return this.request('POST', '/statuses/import/json', { body: items, params: ctx });
  }

  async importStatusesCsv(csvContent: string, ctx: ShopContextParams): Promise<ImportResult> {
    return this.uploadCsv('/statuses/import/csv', csvContent, ctx);
  }

  async exportStatusesJson(ctx: ShopContextParams): Promise<StatusExportItem[]> {
    return this.request('GET', '/statuses/export/json', { params: ctx });
  }

  async exportStatusesCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', '/statuses/export/csv', { params: ctx });
  }

  async getExampleStatusesJson(): Promise<StatusExportItem[]> {
    return this.requestPublic('GET', '/statuses/examples/json');
  }

  async getExampleStatusesCsv(): Promise<string> {
    return this.requestTextPublic('GET', '/statuses/examples/csv');
  }
}
