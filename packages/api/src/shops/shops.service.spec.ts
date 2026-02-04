import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseService } from '../database/database.service.js';
import { MarketplacesService } from '../marketplaces/marketplaces.service.js';
import { SalesHistoryService } from '../sales-history/sales-history.service.js';
import { SkusService } from '../skus/skus.service.js';
import { ShopsService } from './shops.service.js';

describe('ShopsService', () => {
  let service: ShopsService;
  let mockDb: Partial<DatabaseService>;
  let mockSkusService: { deleteByShopId: ReturnType<typeof vi.fn> };
  let mockSalesHistoryService: { deleteByShopId: ReturnType<typeof vi.fn> };
  let mockMarketplacesService: { deleteByShopId: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDb = {
      selectFrom: vi.fn().mockReturnThis(),
      insertInto: vi.fn().mockReturnThis(),
      updateTable: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
    };
    mockSkusService = {
      deleteByShopId: vi.fn(),
    };
    mockSalesHistoryService = {
      deleteByShopId: vi.fn(),
    };
    mockMarketplacesService = {
      deleteByShopId: vi.fn(),
    };
    service = new ShopsService(
      mockDb as DatabaseService,
      mockSkusService as unknown as SkusService,
      mockSalesHistoryService as unknown as SalesHistoryService,
      mockMarketplacesService as unknown as MarketplacesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteData', () => {
    it('should delete sales history, skus, and marketplaces for a shop', async () => {
      vi.mocked(mockSalesHistoryService.deleteByShopId).mockResolvedValue(10);
      vi.mocked(mockSkusService.deleteByShopId).mockResolvedValue(5);
      vi.mocked(mockMarketplacesService.deleteByShopId).mockResolvedValue(3);

      const result = await service.deleteData(1);

      expect(result).toEqual({ skusDeleted: 5, salesHistoryDeleted: 10, marketplacesDeleted: 3 });
      expect(mockSalesHistoryService.deleteByShopId).toHaveBeenCalledWith(1);
      expect(mockSkusService.deleteByShopId).toHaveBeenCalledWith(1);
      expect(mockMarketplacesService.deleteByShopId).toHaveBeenCalledWith(1);
    });

    it('should delete sales history before skus and marketplaces', async () => {
      const callOrder: string[] = [];
      vi.mocked(mockSalesHistoryService.deleteByShopId).mockImplementation(async () => {
        callOrder.push('salesHistory');
        return 0;
      });
      vi.mocked(mockSkusService.deleteByShopId).mockImplementation(async () => {
        callOrder.push('skus');
        return 0;
      });
      vi.mocked(mockMarketplacesService.deleteByShopId).mockImplementation(async () => {
        callOrder.push('marketplaces');
        return 0;
      });

      await service.deleteData(1);

      expect(callOrder).toEqual(['salesHistory', 'skus', 'marketplaces']);
    });

    it('should return zero counts when shop has no data', async () => {
      vi.mocked(mockSalesHistoryService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockSkusService.deleteByShopId).mockResolvedValue(0);
      vi.mocked(mockMarketplacesService.deleteByShopId).mockResolvedValue(0);

      const result = await service.deleteData(999);

      expect(result).toEqual({ skusDeleted: 0, salesHistoryDeleted: 0, marketplacesDeleted: 0 });
    });
  });
});
