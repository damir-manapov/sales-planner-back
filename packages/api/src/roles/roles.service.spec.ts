import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseService } from '../database/index.js';
import { RolesService } from './roles.service.js';

describe('RolesService', () => {
  let service: RolesService;
  let mockDb: Partial<DatabaseService>;

  beforeEach(() => {
    mockDb = {
      selectFrom: vi.fn().mockReturnThis(),
      insertInto: vi.fn().mockReturnThis(),
      updateTable: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
    };

    service = new RolesService(mockDb as DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
