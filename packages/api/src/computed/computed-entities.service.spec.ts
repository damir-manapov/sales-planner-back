import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComputedEntitiesService } from './computed-entities.service.js';
import type { DatabaseService } from '../database/index.js';

// Mock the views module
vi.mock('../../views/index.js', () => ({
  MATERIALIZED_VIEWS: [
    { name: 'mv_sku_metrics', description: 'SKU metrics view', dependencies: [] },
    {
      name: 'mv_sales_summary',
      description: 'Sales summary view',
      dependencies: ['mv_sku_metrics'],
    },
  ],
  getViewsInOrder: () => [
    { name: 'mv_sku_metrics', description: 'SKU metrics view', dependencies: [] },
    {
      name: 'mv_sales_summary',
      description: 'Sales summary view',
      dependencies: ['mv_sku_metrics'],
    },
  ],
}));

describe('ComputedEntitiesService', () => {
  let service: ComputedEntitiesService;
  let mockDb: Partial<DatabaseService>;

  beforeEach(() => {
    // Mock the database service - sql template literals call execute on it
    mockDb = {} as Partial<DatabaseService>;

    service = new ComputedEntitiesService(mockDb as DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getViews', () => {
    it('should return list of materialized views', () => {
      const views = service.getViews();

      expect(views).toHaveLength(2);
      expect(views[0]).toEqual({
        name: 'mv_sku_metrics',
        description: 'SKU metrics view',
      });
      expect(views[1]).toEqual({
        name: 'mv_sales_summary',
        description: 'Sales summary view',
      });
    });

    it('should return view names and descriptions only', () => {
      const views = service.getViews();

      for (const view of views) {
        expect(view).toHaveProperty('name');
        expect(view).toHaveProperty('description');
        expect(Object.keys(view)).toHaveLength(2);
      }
    });
  });

  describe('refreshView', () => {
    it('should return error for unknown view', async () => {
      const result = await service.refreshView('unknown_view');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown view: unknown_view');
      expect(result.duration).toBe(0);
      expect(result.view).toBe('unknown_view');
    });
  });

  describe('refreshAll', () => {
    it('should return results array structure', async () => {
      // Mock refreshView to return success
      vi.spyOn(service, 'refreshView').mockResolvedValue({
        view: 'mv_sku_metrics',
        duration: 100,
        success: true,
      });

      const result = await service.refreshAll();

      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('totalDuration');
      expect(result).toHaveProperty('success');
      expect(Array.isArray(result.results)).toBe(true);
    });

    it('should stop on first failure', async () => {
      const refreshViewSpy = vi
        .spyOn(service, 'refreshView')
        .mockResolvedValueOnce({
          view: 'mv_sku_metrics',
          duration: 100,
          success: false,
          error: 'Test error',
        })
        .mockResolvedValueOnce({
          view: 'mv_sales_summary',
          duration: 50,
          success: true,
        });

      const result = await service.refreshAll();

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(1);
      expect(refreshViewSpy).toHaveBeenCalledTimes(1);
    });

    it('should refresh all views when all succeed', async () => {
      const refreshViewSpy = vi.spyOn(service, 'refreshView').mockResolvedValue({
        view: 'test',
        duration: 100,
        success: true,
      });

      const result = await service.refreshAll();

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(refreshViewSpy).toHaveBeenCalledTimes(2);
    });
  });
});
