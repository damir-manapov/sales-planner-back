import { Injectable } from '@nestjs/common';
import type {
  DeleteDataResult,
  PaginatedResponse,
  PaginationQuery,
  Shop,
} from '@sales-planner/shared';
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
import type { CreateShopDto, UpdateShopDto } from './shops.schema.js';

export type { Shop };
export type { CreateShopDto, UpdateShopDto };

@Injectable()
export class ShopsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly skusService: SkusService,
    private readonly salesHistoryService: SalesHistoryService,
    private readonly marketplacesService: MarketplacesService,
    private readonly brandsService: BrandsService,
    private readonly categoriesService: CategoriesService,
    private readonly groupsService: GroupsService,
    private readonly statusesService: StatusesService,
    private readonly suppliersService: SuppliersService,
    private readonly warehousesService: WarehousesService,
  ) {}

  async count(): Promise<number> {
    const result = await this.db
      .selectFrom('shops')
      .select(this.db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async countByTenantId(tenantId: number): Promise<number> {
    const result = await this.db
      .selectFrom('shops')
      .select(this.db.fn.countAll<number>().as('count'))
      .where('tenant_id', '=', tenantId)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async findAll(query?: PaginationQuery): Promise<Shop[]> {
    let q = this.db.selectFrom('shops').selectAll().orderBy('id', 'asc');
    if (query?.limit !== undefined) q = q.limit(query.limit);
    if (query?.offset !== undefined) q = q.offset(query.offset);
    return q.execute();
  }

  async findAllPaginated(query: PaginationQuery = {}): Promise<PaginatedResponse<Shop>> {
    const [total, items] = await Promise.all([this.count(), this.findAll(query)]);
    return { items, total, limit: query.limit ?? 0, offset: query.offset ?? 0 };
  }

  async findByTenantId(tenantId: number, query?: PaginationQuery): Promise<Shop[]> {
    let q = this.db
      .selectFrom('shops')
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .orderBy('id', 'asc');
    if (query?.limit !== undefined) q = q.limit(query.limit);
    if (query?.offset !== undefined) q = q.offset(query.offset);
    return q.execute();
  }

  async findByTenantIdPaginated(
    tenantId: number,
    query: PaginationQuery = {},
  ): Promise<PaginatedResponse<Shop>> {
    const [total, items] = await Promise.all([
      this.countByTenantId(tenantId),
      this.findByTenantId(tenantId, query),
    ]);
    return { items, total, limit: query.limit ?? 0, offset: query.offset ?? 0 };
  }

  async findById(id: number): Promise<Shop | undefined> {
    return this.db.selectFrom('shops').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async create(dto: CreateShopDto): Promise<Shop> {
    return this.db.insertInto('shops').values(dto).returningAll().executeTakeFirstOrThrow();
  }

  async update(id: number, dto: Partial<CreateShopDto>): Promise<Shop | undefined> {
    return this.db
      .updateTable('shops')
      .set({ ...dto, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('shops').where('id', '=', id).execute();
  }

  async deleteData(id: number): Promise<DeleteDataResult> {
    // Delete sales history first (references SKUs and marketplaces)
    const salesHistoryDeleted = await this.salesHistoryService.deleteByShopId(id);

    // Delete SKUs
    const skusDeleted = await this.skusService.deleteByShopId(id);

    // Delete marketplaces
    const marketplacesDeleted = await this.marketplacesService.deleteByShopId(id);

    // Delete coded entities
    const brandsDeleted = await this.brandsService.deleteByShopId(id);
    const categoriesDeleted = await this.categoriesService.deleteByShopId(id);
    const groupsDeleted = await this.groupsService.deleteByShopId(id);
    const statusesDeleted = await this.statusesService.deleteByShopId(id);
    const suppliersDeleted = await this.suppliersService.deleteByShopId(id);
    const warehousesDeleted = await this.warehousesService.deleteByShopId(id);

    return {
      skusDeleted,
      salesHistoryDeleted,
      marketplacesDeleted,
      brandsDeleted,
      categoriesDeleted,
      groupsDeleted,
      statusesDeleted,
      suppliersDeleted,
      warehousesDeleted,
    };
  }
}
