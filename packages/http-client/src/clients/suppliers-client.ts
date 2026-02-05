import type {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  ImportSupplierItem,
  SupplierExportItem,
  ImportResult,
  ShopContextParams,
} from '@sales-planner/shared';
import { ImportExportBaseClient } from './import-export-base-client.js';

export class SuppliersClient extends ImportExportBaseClient {
  async getSuppliers(ctx: ShopContextParams): Promise<Supplier[]> {
    return this.request('GET', '/suppliers', { params: ctx });
  }

  async getSupplier(ctx: ShopContextParams, id: number): Promise<Supplier> {
    return this.request('GET', `/suppliers/${id}`, { params: ctx });
  }

  async getSupplierByCode(ctx: ShopContextParams, code: string): Promise<Supplier> {
    return this.request('GET', `/suppliers/code/${encodeURIComponent(code)}`, { params: ctx });
  }

  async createSupplier(ctx: ShopContextParams, request: CreateSupplierRequest): Promise<Supplier> {
    return this.request('POST', '/suppliers', { params: ctx, body: request });
  }

  async updateSupplier(
    ctx: ShopContextParams,
    id: number,
    request: UpdateSupplierRequest,
  ): Promise<Supplier> {
    return this.request('PUT', `/suppliers/${id}`, { params: ctx, body: request });
  }

  async deleteSupplier(ctx: ShopContextParams, id: number): Promise<void> {
    return this.request('DELETE', `/suppliers/${id}`, { params: ctx });
  }

  async importJson(ctx: ShopContextParams, items: ImportSupplierItem[]): Promise<ImportResult> {
    return this.request('POST', '/suppliers/import/json', { params: ctx, body: items });
  }

  async importCsv(ctx: ShopContextParams, csvContent: string): Promise<ImportResult> {
    return this.uploadCsv('/suppliers/import/csv', csvContent, ctx);
  }

  async exportJson(ctx: ShopContextParams): Promise<SupplierExportItem[]> {
    return this.request('GET', '/suppliers/export/json', { params: ctx });
  }

  async exportCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', '/suppliers/export/csv', { params: ctx });
  }

  async getExampleJson(): Promise<SupplierExportItem[]> {
    return this.requestPublic('GET', '/suppliers/examples/json');
  }

  async getExampleCsv(): Promise<string> {
    return this.requestTextPublic('GET', '/suppliers/examples/csv');
  }
}
