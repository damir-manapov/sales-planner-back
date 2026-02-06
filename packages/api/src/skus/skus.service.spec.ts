import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoriesService } from '../categories/categories.service.js';
import { GroupsService } from '../groups/groups.service.js';
import { StatusesService } from '../statuses/statuses.service.js';
import { SuppliersService } from '../suppliers/suppliers.service.js';
import { SkusService } from './skus.service.js';
import { SkusRepository } from './skus.repository.js';

describe('SkusService', () => {
  let service: SkusService;
  let mockRepository: Partial<SkusRepository>;
  let mockCategoriesService: Partial<CategoriesService>;
  let mockGroupsService: Partial<GroupsService>;
  let mockStatusesService: Partial<StatusesService>;
  let mockSuppliersService: Partial<SuppliersService>;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByShopId: vi.fn(),
      findByShopIdPaginated: vi.fn(),
      findByCodeAndShop: vi.fn(),
      countByShopId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteByShopId: vi.fn(),
      bulkUpsert: vi.fn(),
      findCodesByShopId: vi.fn().mockResolvedValue(new Set()),
      exportForShop: vi.fn(),
      findOrCreateByCode: vi.fn().mockResolvedValue({ codeToId: new Map(), created: 0 }),
      isUniqueViolation: vi.fn().mockReturnValue(false),
    };

    mockCategoriesService = {
      findOrCreateByCode: vi.fn().mockResolvedValue({ codeToId: new Map(), created: 0 }),
    };

    mockGroupsService = {
      findOrCreateByCode: vi.fn().mockResolvedValue({ codeToId: new Map(), created: 0 }),
    };

    mockStatusesService = {
      findOrCreateByCode: vi.fn().mockResolvedValue({ codeToId: new Map(), created: 0 }),
    };

    mockSuppliersService = {
      findOrCreateByCode: vi.fn().mockResolvedValue({ codeToId: new Map(), created: 0 }),
    };

    service = new SkusService(
      mockRepository as SkusRepository,
      mockCategoriesService as CategoriesService,
      mockGroupsService as GroupsService,
      mockStatusesService as StatusesService,
      mockSuppliersService as SuppliersService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
