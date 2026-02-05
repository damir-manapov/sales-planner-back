import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseService } from '../database/index.js';
import { CategoriesService } from './categories.service.js';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockDb: Partial<DatabaseService>;

  beforeEach(() => {
    mockDb = {
      selectFrom: vi.fn().mockReturnThis(),
      insertInto: vi.fn().mockReturnThis(),
      updateTable: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
    };
    service = new CategoriesService(mockDb as DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByShopId', () => {
    it('should call database with correct shop_id', async () => {
      const mockExecute = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ execute: mockExecute });
      const mockSelectAll = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.selectFrom = vi.fn().mockReturnValue({ selectAll: mockSelectAll });

      await service.findByShopId(1);

      expect(mockDb.selectFrom).toHaveBeenCalledWith('categories');
      expect(mockSelectAll).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('shop_id', '=', 1);
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  describe('findByTenantId', () => {
    it('should call database with correct tenant_id', async () => {
      const mockExecute = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ execute: mockExecute });
      const mockSelectAll = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.selectFrom = vi.fn().mockReturnValue({ selectAll: mockSelectAll });

      await service.findByTenantId(1);

      expect(mockDb.selectFrom).toHaveBeenCalledWith('categories');
      expect(mockSelectAll).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('tenant_id', '=', 1);
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  describe('findByCodeAndShop', () => {
    it('should call database with correct code and shop_id', async () => {
      const mockExecuteTakeFirst = vi.fn().mockResolvedValue(undefined);
      const mockWhere2 = vi.fn().mockReturnValue({ executeTakeFirst: mockExecuteTakeFirst });
      const mockWhere1 = vi.fn().mockReturnValue({ where: mockWhere2 });
      const mockSelectAll = vi.fn().mockReturnValue({ where: mockWhere1 });
      mockDb.selectFrom = vi.fn().mockReturnValue({ selectAll: mockSelectAll });

      await service.findByCodeAndShop('mavyko', 1);

      expect(mockDb.selectFrom).toHaveBeenCalledWith('categories');
      expect(mockSelectAll).toHaveBeenCalled();
      expect(mockWhere1).toHaveBeenCalledWith('code', '=', 'mavyko');
      expect(mockWhere2).toHaveBeenCalledWith('shop_id', '=', 1);
      expect(mockExecuteTakeFirst).toHaveBeenCalled();
    });
  });

  describe('exportForShop', () => {
    it('should return categories with only code and title', async () => {
      const mockCategorys = [
        { code: 'mavyko', title: 'Мавико' },
        { code: 'marshall', title: 'MARSHALL' },
      ];

      const mockExecute = vi.fn().mockResolvedValue(mockCategorys);
      const mockOrderBy = vi.fn().mockReturnValue({ execute: mockExecute });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockSelect = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.selectFrom = vi.fn().mockReturnValue({ select: mockSelect });

      const result = await service.exportForShop(1);

      expect(mockDb.selectFrom).toHaveBeenCalledWith('categories');
      expect(mockSelect).toHaveBeenCalledWith(['code', 'title']);
      expect(mockWhere).toHaveBeenCalledWith('shop_id', '=', 1);
      expect(mockOrderBy).toHaveBeenCalledWith('code', 'asc');
      expect(result).toEqual(mockCategorys);
    });
  });
});
