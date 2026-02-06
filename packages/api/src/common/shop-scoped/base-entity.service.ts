import type { ShopScopedBaseEntity } from '@sales-planner/shared';
import { DuplicateResourceException, isUniqueViolation } from '../exceptions.js';
import type { IShopScopedBaseRepository } from './base-repository.interface.js';

/**
 * Base service for shop-scoped entities (without code operations)
 * Provides common CRUD operations via repository
 */
export abstract class ShopScopedBaseEntityService<
  TEntity extends ShopScopedBaseEntity,
  TCreateDto,
  TUpdateDto,
> {
  constructor(
    protected readonly repository: IShopScopedBaseRepository<TEntity, TCreateDto, TUpdateDto>,
    protected readonly entityName: string,
  ) {}

  async findAll(): Promise<TEntity[]> {
    return this.repository.findAll();
  }

  async findById(id: number): Promise<TEntity | undefined> {
    return this.repository.findById(id);
  }

  async findByShopId(shopId: number): Promise<TEntity[]> {
    return this.repository.findByShopId(shopId);
  }

  async findByTenantId(tenantId: number): Promise<TEntity[]> {
    return this.repository.findByTenantId(tenantId);
  }

  /**
   * Get identifier for error messages. Override in subclass for specific identifier.
   */
  protected getCreateIdentifier(_dto: TCreateDto): string {
    return 'unknown';
  }

  async create(dto: TCreateDto): Promise<TEntity> {
    try {
      return await this.repository.create(dto);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException(this.entityName, this.getCreateIdentifier(dto), 'this shop');
      }
      throw error;
    }
  }

  /**
   * Get identifier for update error messages. Override in subclass for specific identifier.
   */
  protected getUpdateIdentifier(_dto: TUpdateDto): string {
    return 'unknown';
  }

  async update(id: number, dto: TUpdateDto): Promise<TEntity | undefined> {
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException(this.entityName, this.getUpdateIdentifier(dto), 'this shop');
      }
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    return this.repository.delete(id);
  }

  async deleteByShopId(shopId: number): Promise<number> {
    return this.repository.deleteByShopId(shopId);
  }
}
