import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkusService } from './skus.service.js';
import { DatabaseService } from '../database/index.js';

describe('SkusService', () => {
  let service: SkusService;
  let mockDb: Partial<DatabaseService>;

  beforeEach(() => {
    mockDb = {
      selectFrom: vi.fn().mockReturnThis(),
      insertInto: vi.fn().mockReturnThis(),
      updateTable: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
    };
    service = new SkusService(mockDb as DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
