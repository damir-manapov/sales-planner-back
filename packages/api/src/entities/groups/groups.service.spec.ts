import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICodedShopScopedRepository } from '../../common/index.js';
import type { Group } from '@sales-planner/shared';
import { GroupsService } from './groups.service.js';
import type { GroupsRepository } from './groups.repository.js';

describe('GroupsService', () => {
  let service: GroupsService;
  let mockRepository: Partial<ICodedShopScopedRepository<Group, any, any>>;

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
    service = new GroupsService(mockRepository as unknown as GroupsRepository);
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
      await service.findByCodeAndShop('GROUP1', 1);
      expect(mockRepository.findByCodeAndShop).toHaveBeenCalledWith('group1', 1);
    });
  });

  describe('exportForShop', () => {
    it('should delegate to repository', async () => {
      const mockGroups = [
        { code: 'group1', title: 'Group 1' },
        { code: 'group2', title: 'Group 2' },
      ];
      mockRepository.exportForShop = vi.fn().mockResolvedValue(mockGroups);

      const result = await service.exportForShop(1);

      expect(mockRepository.exportForShop).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockGroups);
    });
  });
});
