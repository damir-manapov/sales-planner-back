import type {
  Group,
  CreateGroupRequest,
  UpdateGroupDto,
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

  async getGroup(id: number, ctx: ShopContextParams): Promise<Group> {
    return this.request('GET', `/groups/${id}`, { params: ctx });
  }

  async createGroup(dto: CreateGroupRequest, ctx: ShopContextParams): Promise<Group> {
    return this.request('POST', '/groups', { body: dto, params: ctx });
  }

  async updateGroup(id: number, dto: UpdateGroupDto, ctx: ShopContextParams): Promise<Group> {
    return this.request('PUT', `/groups/${id}`, { body: dto, params: ctx });
  }

  async deleteGroup(id: number, ctx: ShopContextParams): Promise<void> {
    return this.request('DELETE', `/groups/${id}`, { params: ctx });
  }

  // Import/Export methods
  async importGroupsJson(items: ImportGroupItem[], ctx: ShopContextParams): Promise<ImportResult> {
    return this.request('POST', '/groups/import/json', { body: items, params: ctx });
  }

  async importGroupsCsv(csvContent: string, ctx: ShopContextParams): Promise<ImportResult> {
    return this.uploadCsv('/groups/import/csv', csvContent, ctx);
  }

  async exportGroupsJson(ctx: ShopContextParams): Promise<GroupExportItem[]> {
    return this.request('GET', '/groups/export/json', { params: ctx });
  }

  async exportGroupsCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', '/groups/export/csv', { params: ctx });
  }

  async getExampleGroupsJson(_ctx: ShopContextParams): Promise<GroupExportItem[]> {
    return this.requestPublic('GET', '/groups/examples/json');
  }

  async getExampleGroupsCsv(_ctx: ShopContextParams): Promise<string> {
    return this.requestTextPublic('GET', '/groups/examples/csv');
  }
}
