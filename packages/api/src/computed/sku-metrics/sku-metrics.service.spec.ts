import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SkuMetrics, PaginatedResponse, PaginationQuery } from '@sales-planner/shared';
import { SkuMetricsService } from './sku-metrics.service.js';
import type { SkuMetricsRepository } from './sku-metrics.repository.js';

describe('SkuMetricsService', () => {
  let service: SkuMetricsService;
  let mockRepository: Partial<SkuMetricsRepository>;

  const mockSkuMetrics: SkuMetrics = {
    id: 1,
    sku_id: 100,
    shop_id: 1,
    tenant_id: 1,
    sku_code: 'SKU001',
    sku_title: 'Test SKU',
    group_id: 10,
    category_id: 20,
    status_id: 40,
    supplier_id: 50,
    group_code: 'GRP01',
    category_code: 'CAT01',
    status_code: 'active',
    supplier_code: 'SUP01',
    last_period: '2026-01',
    last_period_sales: 50,
    current_stock: 100,
    days_of_stock: 60,
    abc_class: 'A',
    sales_rank: 1,
    computed_at: new Date('2026-02-01'),
  };

  beforeEach(() => {
    mockRepository = {
      findByShopIdPaginated: vi.fn().mockResolvedValue({
        items: [mockSkuMetrics],
        total: 1,
        offset: 0,
        limit: 10,
      } satisfies PaginatedResponse<SkuMetrics>),
      findByShopId: vi.fn().mockResolvedValue([mockSkuMetrics]),
      findById: vi.fn().mockResolvedValue(mockSkuMetrics),
      findByAbcClass: vi.fn().mockResolvedValue([mockSkuMetrics]),
    };
    service = new SkuMetricsService(mockRepository as unknown as SkuMetricsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByShopIdPaginated', () => {
    it('should delegate to repository with query', async () => {
      const query: PaginationQuery = { offset: 0, limit: 10 };
      const result = await service.findByShopIdPaginated(1, query);

      expect(mockRepository.findByShopIdPaginated).toHaveBeenCalledWith(1, query);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should use empty query by default', async () => {
      await service.findByShopIdPaginated(1);

      expect(mockRepository.findByShopIdPaginated).toHaveBeenCalledWith(1, {});
    });
  });

  describe('findByShopId', () => {
    it('should delegate to repository', async () => {
      const result = await service.findByShopId(1);

      expect(mockRepository.findByShopId).toHaveBeenCalledWith(1, undefined);
      expect(result).toEqual([mockSkuMetrics]);
    });

    it('should pass query options', async () => {
      const query: PaginationQuery = { limit: 50 };
      await service.findByShopId(1, query);

      expect(mockRepository.findByShopId).toHaveBeenCalledWith(1, query);
    });
  });

  describe('findById', () => {
    it('should delegate to repository', async () => {
      const result = await service.findById(1);

      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSkuMetrics);
    });

    it('should return undefined when not found', async () => {
      mockRepository.findById = vi.fn().mockResolvedValue(undefined);

      const result = await service.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findByAbcClass', () => {
    it('should delegate to repository with class A', async () => {
      await service.findByAbcClass(1, 'A');

      expect(mockRepository.findByAbcClass).toHaveBeenCalledWith(1, 'A');
    });

    it('should delegate to repository with class B', async () => {
      await service.findByAbcClass(1, 'B');

      expect(mockRepository.findByAbcClass).toHaveBeenCalledWith(1, 'B');
    });

    it('should delegate to repository with class C', async () => {
      await service.findByAbcClass(1, 'C');

      expect(mockRepository.findByAbcClass).toHaveBeenCalledWith(1, 'C');
    });
  });
});
