import type { ShopContextParams } from '@sales-planner/shared';
import { BaseClient } from './base-client.js';

/**
 * View metadata returned by getViews
 */
export interface ViewInfo {
  name: string;
  description: string;
}

/**
 * Result of refreshing a single view
 */
export interface RefreshResult {
  view: string;
  duration: number;
  success: boolean;
  error?: string;
}

/**
 * Result of refreshing all views
 */
export interface RefreshAllResult {
  results: RefreshResult[];
  totalDuration: number;
  success: boolean;
}

/**
 * Client for managing computed entities (materialized views).
 * Provides view listing and refresh operations.
 */
export class ComputedEntitiesClient extends BaseClient {
  /**
   * Get list of all available materialized views
   */
  async getViews(ctx: ShopContextParams): Promise<ViewInfo[]> {
    return this.request('GET', '/computed/views', {
      params: ctx,
    });
  }

  /**
   * Refresh all materialized views in dependency order
   */
  async refreshAll(ctx: ShopContextParams): Promise<RefreshAllResult> {
    return this.request('POST', '/computed/refresh', {
      params: ctx,
    });
  }

  /**
   * Refresh a single materialized view by name
   */
  async refreshView(ctx: ShopContextParams, viewName: string): Promise<RefreshResult> {
    return this.request('POST', `/computed/refresh/${viewName}`, {
      params: ctx,
    });
  }
}
