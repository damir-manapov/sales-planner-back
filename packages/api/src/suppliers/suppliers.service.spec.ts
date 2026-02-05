import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseService } from '../database/index.js';
import { SuppliersService } from './suppliers.service.js';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let mockDb: Partial<DatabaseService>;

  beforeEach(() => {
    mockDb = {
      selectFrom: vi.fn().mockReturnThis(),
      insertInto: vi.fn().mockReturnThis(),
      updateTable: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
    };
    service = new SuppliersService(mockDb as DatabaseService);
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

      expect(mockDb.selectFrom).toHaveBeenCalledWith('suppliers');
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

      expect(mockDb.selectFrom).toHaveBeenCalledWith('suppliers');
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

      await service.findByCodeAndShop('supplier1', 1);

      expect(mockDb.selectFrom).toHaveBeenCalledWith('suppliers');
      expect(mockSelectAll).toHaveBeenCalled();
      expect(mockWhere1).toHaveBeenCalledWith('code', '=', 'supplier1');
      expect(mockWhere2).toHaveBeenCalledWith('shop_id', '=', 1);
      expect(mockExecuteTakeFirst).toHaveBeenCalled();
    });
  });

  describe('exportForShop', () => {
    it('should return suppliers with only code and title', async () => {
      const mockSuppliers = [
        { code: 'supplier1', title: 'Example Supplier 1' },
        { code: 'supplier2', title: 'Example Supplier 2' },
      ];

      const mockExecute = vi.fn().mockResolvedValue(mockSuppliers);
      const mockOrderBy = vi.fn().mockReturnValue({ execute: mockExecute });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockSelect = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.selectFrom = vi.fn().mockReturnValue({ select: mockSelect });

      const result = await service.exportForShop(1);

      expect(mockDb.selectFrom).toHaveBeenCalledWith('suppliers');
      expect(mockSelect).toHaveBeenCalledWith(['code', 'title']);
      expect(mockWhere).toHaveBeenCalledWith('shop_id', '=', 1);
      expect(mockOrderBy).toHaveBeenCalledWith('code', 'asc');
      expect(result).toEqual(mockSuppliers);
    });
  });
});
