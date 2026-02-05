import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseService } from '../database/index.js';
import { CategoriesService } from '../categories/categories.service.js';
import { GroupsService } from '../groups/groups.service.js';
import { StatusesService } from '../statuses/statuses.service.js';
import { SuppliersService } from '../suppliers/suppliers.service.js';
import { SkusService } from './skus.service.js';

describe('SkusService', () => {
  let service: SkusService;
  let mockDb: Partial<DatabaseService>;
  let mockCategoriesService: Partial<CategoriesService>;
  let mockGroupsService: Partial<GroupsService>;
  let mockStatusesService: Partial<StatusesService>;
  let mockSuppliersService: Partial<SuppliersService>;

  beforeEach(() => {
    mockDb = {
      selectFrom: vi.fn().mockReturnThis(),
      insertInto: vi.fn().mockReturnThis(),
      updateTable: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
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
      mockDb as DatabaseService,
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
