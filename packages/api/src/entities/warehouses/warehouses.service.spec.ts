import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICodedShopScopedRepository } from '../../common/index.js';
import type { Warehouse, CreateWarehouseDto, UpdateWarehouseDto } from '@sales-planner/shared';
import { WarehousesService } from './warehouses.service.js';
import type { WarehousesRepository } from './warehouses.repository.js';

describe('WarehousesService', () => {
  let service: WarehousesService;
  let mockRepository: Partial<
    ICodedShopScopedRepository<Warehouse, CreateWarehouseDto, UpdateWarehouseDto>
  >;

  beforeEach(() => {
    mockRepository = {
      findAll: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(undefined),
      findByShopId: vi.fn().mockResolvedValue([]),
      findByTenantId: vi.fn().mockResolvedValue([]),
      findByCodeAndShop: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue({ id: 1, code: 'test', title: 'Test' }),
      update: vi.fn().mockResolvedValue({ id: 1, code: 'test', title: 'Updated' }),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteByShopId: vi.fn().mockResolvedValue(0),
      exportForShop: vi.fn().mockResolvedValue([]),
      findOrCreateByCode: vi.fn().mockResolvedValue({ codeToId: new Map(), created: 0 }),
      bulkUpsert: vi.fn().mockResolvedValue({ created: 0, updated: 0 }),
    };
    service = new WarehousesService(mockRepository as unknown as WarehousesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByShopId', () => {
    it('should delegate to repository', async () => {
      await service.findByShopId(1);
      expect(mockRepository.findByShopId).toHaveBeenCalledWith(1);
    });
  });

  describe('findByTenantId', () => {
    it('should delegate to repository', async () => {
      await service.findByTenantId(1);
      expect(mockRepository.findByTenantId).toHaveBeenCalledWith(1);
    });
  });

  describe('findByCodeAndShop', () => {
    it('should normalize code and delegate to repository', async () => {
      await service.findByCodeAndShop('WAREHOUSE1', 1);
      expect(mockRepository.findByCodeAndShop).toHaveBeenCalledWith('warehouse1', 1);
    });
  });

  describe('exportForShop', () => {
    it('should delegate to repository', async () => {
      const mockWarehouses = [
        { code: 'main', title: 'Main Warehouse' },
        { code: 'ozon', title: 'Ozon FBS' },
      ];
      mockRepository.exportForShop = vi.fn().mockResolvedValue(mockWarehouses);

      const result = await service.exportForShop(1);

      expect(mockRepository.exportForShop).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockWarehouses);
    });
  });
});
