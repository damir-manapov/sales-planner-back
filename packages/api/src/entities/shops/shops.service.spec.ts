import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseService } from '../../database/database.service.js';
import { BrandsService } from '../brands/brands.service.js';
import { CategoriesService } from '../categories/categories.service.js';
import { GroupsService } from '../groups/groups.service.js';
import { MarketplacesService } from '../marketplaces/marketplaces.service.js';
import { SalesHistoryService } from '../sales-history/sales-history.service.js';
import { SkusService } from '../skus/skus.service.js';
import { StatusesService } from '../statuses/statuses.service.js';
import { SuppliersService } from '../suppliers/suppliers.service.js';
import { WarehousesService } from '../warehouses/warehouses.service.js';
import { ShopsService } from './shops.service.js';

describe('ShopsService', () => {
  let service: ShopsService;
  let mockDb: Partial<DatabaseService>;
  let mockSkusService: { deleteByShopId: ReturnType<typeof vi.fn> };
  let mockSalesHistoryService: { deleteByShopId: ReturnType<typeof vi.fn> };
  let mockMarketplacesService: { deleteByShopId: ReturnType<typeof vi.fn> };
  let mockBrandsService: { deleteByShopId: ReturnType<typeof vi.fn> };
  let mockCategoriesService: { deleteByShopId: ReturnType<typeof vi.fn> };
  let mockGroupsService: { deleteByShopId: ReturnType<typeof vi.fn> };
  let mockStatusesService: { deleteByShopId: ReturnType<typeof vi.fn> };
  let mockSuppliersService: { deleteByShopId: ReturnType<typeof vi.fn> };
  let mockWarehousesService: { deleteByShopId: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDb = {
      selectFrom: vi.fn().mockReturnThis(),
      insertInto: vi.fn().mockReturnThis(),
      updateTable: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
    };
    mockSkusService = { deleteByShopId: vi.fn() };
    mockSalesHistoryService = { deleteByShopId: vi.fn() };
    mockMarketplacesService = { deleteByShopId: vi.fn() };
    mockBrandsService = { deleteByShopId: vi.fn() };
    mockCategoriesService = { deleteByShopId: vi.fn() };
    mockGroupsService = { deleteByShopId: vi.fn() };
    mockStatusesService = { deleteByShopId: vi.fn() };
    mockSuppliersService = { deleteByShopId: vi.fn() };
    mockWarehousesService = { deleteByShopId: vi.fn() };

    service = new ShopsService(
      mockDb as DatabaseService,
      mockSkusService as unknown as SkusService,
      mockSalesHistoryService as unknown as SalesHistoryService,
      mockMarketplacesService as unknown as MarketplacesService,
      mockBrandsService as unknown as BrandsService,
      mockCategoriesService as unknown as CategoriesService,
      mockGroupsService as unknown as GroupsService,
      mockStatusesService as unknown as StatusesService,
      mockSuppliersService as unknown as SuppliersService,
      mockWarehousesService as unknown as WarehousesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteData', () => {
    it('should delete all shop data', async () => {
      vi.mocked(mockSalesHistoryService.deleteByShopId).mockResolvedValue(10);
      vi.mocked(mockSkusService.deleteByShopId).mockResolvedValue(5);
      vi.mocked(mockMarketplacesService.deleteByShopId).mockResolvedValue(3);
      vi.mocked(mockBrandsService.deleteByShopId).mockResolvedValue(2);
      vi.mocked(mockCategoriesService.deleteByShopId).mockResolvedValue(4);
      vi.mocked(mockGroupsService.deleteByShopId).mockResolvedValue(6);
      vi.mocked(mockStatusesService.deleteByShopId).mockResolvedValue(1);
      vi.mocked(mockSuppliersService.deleteByShopId).mockResolvedValue(7);
      vi.mocked(mockWarehousesService.deleteByShopId).mockResolvedValue(8);

      const result = await service.deleteData(1);

      expect(result).toEqual({
        skusDeleted: 5,
        salesHistoryDeleted: 10,
        marketplacesDeleted: 3,
        brandsDeleted: 2,
        categoriesDeleted: 4,
        groupsDeleted: 6,
        statusesDeleted: 1,
        suppliersDeleted: 7,
        warehousesDeleted: 8,
      });
    });

    it('should delete sales history before skus', async () => {
      const callOrder: string[] = [];
      vi.mocked(mockSalesHistoryService.deleteByShopId).mockImplementation(async () => {
        callOrder.push('salesHistory');
        return 0;
      });
      vi.mocked(mockSkusService.deleteByShopId).mockImplementation(async () => {
        callOrder.push('skus');
        return 0;
      });
      vi.mocked(mockMarketplacesService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockBrandsService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockCategoriesService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockGroupsService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockStatusesService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockSuppliersService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockWarehousesService.deleteByShopId).mockResolvedValue(0);

      await service.deleteData(1);

      expect(callOrder.indexOf('salesHistory')).toBeLessThan(callOrder.indexOf('skus'));
    });

    it('should return zero counts when shop has no data', async () => {
      vi.mocked(mockSalesHistoryService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockSkusService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockMarketplacesService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockBrandsService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockCategoriesService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockGroupsService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockStatusesService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockSuppliersService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockWarehousesService.deleteByShopId).mockResolvedValue(0);

      const result = await service.deleteData(999);

      expect(result).toEqual({
        skusDeleted: 0,
        salesHistoryDeleted: 0,
        marketplacesDeleted: 0,
        brandsDeleted: 0,
        categoriesDeleted: 0,
        groupsDeleted: 0,
        statusesDeleted: 0,
        suppliersDeleted: 0,
        warehousesDeleted: 0,
      });
    });
  });
});
