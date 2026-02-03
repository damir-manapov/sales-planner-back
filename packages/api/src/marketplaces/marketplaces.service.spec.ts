import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseService } from '../database/index.js';
import { MarketplacesService } from './marketplaces.service.js';

describe('MarketplacesService', () => {
  let service: MarketplacesService;
  let mockDb: Partial<DatabaseService>;

  beforeEach(() => {
    mockDb = {
      selectFrom: vi.fn().mockReturnThis(),
      insertInto: vi.fn().mockReturnThis(),
      updateTable: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
    };
    service = new MarketplacesService(mockDb as DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
