import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'kysely';
import { DatabaseService } from '../database/index.js';
import { MATERIALIZED_VIEWS, getViewsInOrder } from '../../views/index.js';

export interface RefreshResult {
  view: string;
  duration: number;
  success: boolean;
  error?: string;
}

export interface RefreshAllResult {
  results: RefreshResult[];
  totalDuration: number;
  success: boolean;
}

@Injectable()
export class ComputedEntitiesService {
  private readonly logger = new Logger(ComputedEntitiesService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Get list of all materialized views
   */
  getViews(): { name: string; description: string }[] {
    return MATERIALIZED_VIEWS.map((v) => ({
      name: v.name,
      description: v.description,
    }));
  }

  /**
   * Refresh a single materialized view
   */
  async refreshView(viewName: string): Promise<RefreshResult> {
    const view = MATERIALIZED_VIEWS.find((v) => v.name === viewName);
    if (!view) {
      return {
        view: viewName,
        duration: 0,
        success: false,
        error: `Unknown view: ${viewName}`,
      };
    }

    const start = Date.now();
    try {
      await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY ${sql.ref(viewName)}`.execute(this.db);

      const duration = Date.now() - start;
      this.logger.log(`Refreshed ${viewName} in ${duration}ms`);

      return { view: viewName, duration, success: true };
    } catch (error) {
      const duration = Date.now() - start;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to refresh ${viewName}: ${message}`);

      return { view: viewName, duration, success: false, error: message };
    }
  }

  /**
   * Refresh all materialized views in dependency order
   */
  async refreshAll(): Promise<RefreshAllResult> {
    const views = getViewsInOrder();
    const results: RefreshResult[] = [];
    const totalStart = Date.now();

    for (const view of views) {
      const result = await this.refreshView(view.name);
      results.push(result);

      // Stop on first failure
      if (!result.success) {
        break;
      }
    }

    const totalDuration = Date.now() - totalStart;
    const success = results.every((r) => r.success);

    return { results, totalDuration, success };
  }
}
