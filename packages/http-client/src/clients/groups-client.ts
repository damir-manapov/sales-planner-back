import type {
  Group,
  CreateGroupRequest,
  UpdateGroupRequest,
  ImportGroupItem,
  GroupExportItem,
  ImportResult,
  ShopContextParams,
} from '@sales-planner/shared';
import { ImportExportBaseClient } from './import-export-base-client.js';

export class GroupsClient extends ImportExportBaseClient {
  async getGroups(ctx: ShopContextParams): Promise<Group[]> {
    return this.request('GET', '/groups', { params: ctx });
  }

  async getGroup(ctx: ShopContextParams, id: number): Promise<Group> {
    return this.request('GET', `/groups/${id}`, { params: ctx });
  }

  async getGroupByCode(ctx: ShopContextParams, code: string): Promise<Group> {
    return this.request('GET', `/groups/code/${encodeURIComponent(code)}`, { params: ctx });
  }

  async createGroup(ctx: ShopContextParams, request: CreateGroupRequest): Promise<Group> {
    return this.request('POST', '/groups', { body: request, params: ctx });
  }

  async updateGroup(
    ctx: ShopContextParams,
    id: number,
    request: UpdateGroupRequest,
  ): Promise<Group> {
    return this.request('PUT', `/groups/${id}`, { body: request, params: ctx });
  }

  async deleteGroup(ctx: ShopContextParams, id: number): Promise<void> {
    return this.request('DELETE', `/groups/${id}`, { params: ctx });
  }

  // Import/Export methods
  async importJson(ctx: ShopContextParams, items: ImportGroupItem[]): Promise<ImportResult> {
    return this.request('POST', '/groups/import/json', { body: items, params: ctx });
  }

  async importCsv(ctx: ShopContextParams, csvContent: string): Promise<ImportResult> {
    return this.uploadCsv('/groups/import/csv', csvContent, ctx);
  }

  async exportJson(ctx: ShopContextParams): Promise<GroupExportItem[]> {
    return this.request('GET', '/groups/export/json', { params: ctx });
  }

  async exportCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', '/groups/export/csv', { params: ctx });
  }

  async getExampleJson(): Promise<GroupExportItem[]> {
    return this.requestPublic('GET', '/groups/examples/json');
  }

  async getExampleCsv(): Promise<string> {
    return this.requestTextPublic('GET', '/groups/examples/csv');
  }
}
