import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from './users.service.js';
import { DatabaseService } from '../database/database.service.js';

describe('UsersService', () => {
  let usersService: UsersService;
  let mockDb: Partial<DatabaseService>;

  beforeEach(() => {
    mockDb = {
      selectFrom: vi.fn().mockReturnThis(),
      insertInto: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
    } as unknown as Partial<DatabaseService>;

    usersService = new UsersService(mockDb as DatabaseService);
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  describe('findAll', () => {
    it('should call selectFrom with users table', async () => {
      const mockUsers = [{ id: 1, email: 'test@example.com', name: 'Test' }];
      const mockExecute = vi.fn().mockResolvedValue(mockUsers);
      const mockSelectAll = vi.fn().mockReturnValue({ execute: mockExecute });

      mockDb.selectFrom = vi.fn().mockReturnValue({ selectAll: mockSelectAll });

      const result = await usersService.findAll();

      expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findById', () => {
    it('should call selectFrom with users table and where clause', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test' };
      const mockExecuteTakeFirst = vi.fn().mockResolvedValue(mockUser);
      const mockWhere = vi.fn().mockReturnValue({ executeTakeFirst: mockExecuteTakeFirst });
      const mockSelectAll = vi.fn().mockReturnValue({ where: mockWhere });

      mockDb.selectFrom = vi.fn().mockReturnValue({ selectAll: mockSelectAll });

      const result = await usersService.findById(1);

      expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
      expect(result).toEqual(mockUser);
    });
  });
});
