import type { Supplier, ShopContextParams } from '@sales-planner/shared';
import { ImportExportBaseClient } from './import-export-base-client.js';

export interface CreateSupplierDto {
  code: string;
  title: string;
}

export interface UpdateSupplierDto {
  code?: string;
  title?: string;
}

export interface SupplierExportItem {
  code: string;
  title: string;
}

export interface ImportSupplierItem {
  code: string;
  title: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  errors: Array<{ row: number; error: string }>;
}

export class SuppliersClient extends ImportExportBaseClient {
  async getSuppliers(ctx: ShopContextParams): Promise<Supplier[]> {
    return this.request('GET', '/suppliers', { params: ctx });
  }

  async getSupplier(id: number, ctx: ShopContextParams): Promise<Supplier> {
    return this.request('GET', `/suppliers/${id}`, { params: ctx });
  }

  async getSupplierByCode(code: string, ctx: ShopContextParams): Promise<Supplier> {
    return this.request('GET', `/suppliers/code/${encodeURIComponent(code)}`, { params: ctx });
  }

  async createSupplier(data: CreateSupplierDto, ctx: ShopContextParams): Promise<Supplier> {
    return this.request('POST', '/suppliers', { params: ctx, body: data });
  }

  async updateSupplier(
    id: number,
    data: UpdateSupplierDto,
    ctx: ShopContextParams,
  ): Promise<Supplier> {
    return this.request('PUT', `/suppliers/${id}`, { params: ctx, body: data });
  }

  async deleteSupplier(id: number, ctx: ShopContextParams): Promise<{ success: boolean }> {
    return this.request('DELETE', `/suppliers/${id}`, { params: ctx });
  }

  async importJson(items: ImportSupplierItem[], ctx: ShopContextParams): Promise<ImportResult> {
    return this.request('POST', '/suppliers/import/json', { params: ctx, body: items });
  }

  async importCsv(csvContent: string, ctx: ShopContextParams): Promise<ImportResult> {
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
