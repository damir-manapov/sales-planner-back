import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateSkuDto,
  ImportSkuItem,
  PaginatedResponse,
  PaginationQuery,
  Sku,
  SkuExportItem,
  SkuImportResult,
  UpdateSkuDto,
} from '@sales-planner/shared';
import { DuplicateResourceException, isUniqueViolation } from '../../common/index.js';
import { normalizeCode, normalizeSkuCode } from '../../lib/index.js';
import { CategoriesService } from '../categories/categories.service.js';
import { GroupsService } from '../groups/groups.service.js';
import { StatusesService } from '../statuses/statuses.service.js';
import { SuppliersService } from '../suppliers/suppliers.service.js';
import { ImportSkuItemSchema } from './skus.schema.js';
import { SkusRepository } from './skus.repository.js';

export type { Sku };

interface PreparedSkuItem extends ImportSkuItem {
  categoryId?: number;
  groupId?: number;
  statusId?: number;
  supplierId?: number;
}

@Injectable()
export class SkusService {
  constructor(
    private readonly repository: SkusRepository,
    private readonly categoriesService: CategoriesService,
    private readonly groupsService: GroupsService,
    private readonly statusesService: StatusesService,
    private readonly suppliersService: SuppliersService,
  ) {}

  /** Normalize SKU code for consistent lookups */
  normalizeCode(code: string): string {
    return normalizeSkuCode(code);
  }

  // ============ Read Operations (delegate to repository) ============

  async findById(id: number): Promise<Sku | undefined> {
    return this.repository.findById(id);
  }

  async findByShopId(shopId: number): Promise<Sku[]> {
    return this.repository.findByShopId(shopId);
  }

  private static readonly DEFAULT_LIMIT = 100;
  private static readonly MAX_LIMIT = 1000;

  async findByShopIdPaginated(
    shopId: number,
    query: PaginationQuery = {},
  ): Promise<PaginatedResponse<Sku>> {
    const normalizedQuery = {
      ids: query.ids,
      limit: Math.min(query.limit ?? SkusService.DEFAULT_LIMIT, SkusService.MAX_LIMIT),
      offset: query.offset ?? 0,
    };
    return this.repository.findByShopIdPaginated(shopId, normalizedQuery);
  }

  async findByCodeAndShop(code: string, shopId: number): Promise<Sku | undefined> {
    const normalizedCode = normalizeSkuCode(code);
    return this.repository.findByCodeAndShop(normalizedCode, shopId);
  }

  async countByShopId(shopId: number): Promise<number> {
    return this.repository.countByShopId(shopId);
  }

  // ============ Write Operations (business logic + repository) ============

  async create(dto: CreateSkuDto): Promise<Sku> {
    try {
      return await this.repository.create({
        ...dto,
        code: normalizeSkuCode(dto.code),
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException('sku', dto.code, 'this shop');
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateSkuDto): Promise<Sku> {
    const updated = await this.repository.update(id, {
      ...dto,
      ...(dto.code !== undefined && { code: normalizeSkuCode(dto.code) }),
    });
    if (!updated) {
      throw new NotFoundException(`SKU with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    return this.repository.delete(id);
  }

  async deleteByShopId(shopId: number): Promise<number> {
    return this.repository.deleteByShopId(shopId);
  }

  // ============ Import/Export Operations ============

  async bulkUpsert(tenantId: number, shopId: number, items: unknown[]): Promise<SkuImportResult> {
    const validItems: ImportSkuItem[] = [];
    const errors: string[] = [];

    // Validate items
    items.forEach((item, index) => {
      const result = ImportSkuItemSchema.safeParse(item);

      if (!result.success || !result.data) {
        const identifier =
          typeof item === 'object' && item && 'code' in item
            ? (item as { code: string }).code
            : `at index ${index}`;
        const errorMessages =
          result.error?.issues.map((issue) => issue.message).join(', ') || 'Invalid item';
        errors.push(`Invalid item "${identifier}": ${errorMessages}`);
        return;
      }

      validItems.push(result.data);
    });

    // Check for duplicate codes in input
    const codeCounts = new Map<string, number>();
    for (const item of validItems) {
      const code = normalizeSkuCode(item.code);
      codeCounts.set(code, (codeCounts.get(code) || 0) + 1);
    }
    const duplicateCodes = [...codeCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([code, count]) => `"${code}" (${count} times)`);

    if (duplicateCodes.length > 0) {
      throw new BadRequestException(
        `Duplicate SKU codes found in CSV: ${duplicateCodes.join(', ')}`,
      );
    }

    if (validItems.length === 0) {
      return {
        created: 0,
        updated: 0,
        errors,
        categoriesCreated: 0,
        groupsCreated: 0,
        statusesCreated: 0,
        suppliersCreated: 0,
      };
    }

    // Auto-create related entities
    const categoryCodes = validItems
      .filter((i) => i.category)
      .map((i) => normalizeCode(i.category as string));
    const groupCodes = validItems
      .filter((i) => i.group)
      .map((i) => normalizeCode(i.group as string));
    const statusCodes = validItems
      .filter((i) => i.status)
      .map((i) => normalizeCode(i.status as string));
    const supplierCodes = validItems
      .filter((i) => i.supplier)
      .map((i) => normalizeCode(i.supplier as string));

    const [categoryResult, groupResult, statusResult, supplierResult] = await Promise.all([
      categoryCodes.length > 0
        ? this.categoriesService.findOrCreateByCode(tenantId, shopId, categoryCodes)
        : { codeToId: new Map<string, number>(), created: 0 },
      groupCodes.length > 0
        ? this.groupsService.findOrCreateByCode(tenantId, shopId, groupCodes)
        : { codeToId: new Map<string, number>(), created: 0 },
      statusCodes.length > 0
        ? this.statusesService.findOrCreateByCode(tenantId, shopId, statusCodes)
        : { codeToId: new Map<string, number>(), created: 0 },
      supplierCodes.length > 0
        ? this.suppliersService.findOrCreateByCode(tenantId, shopId, supplierCodes)
        : { codeToId: new Map<string, number>(), created: 0 },
    ]);

    // Prepare items with resolved IDs
    const preparedItems: PreparedSkuItem[] = validItems.map((item) => ({
      ...item,
      categoryId: item.category
        ? categoryResult.codeToId.get(normalizeCode(item.category))
        : undefined,
      groupId: item.group ? groupResult.codeToId.get(normalizeCode(item.group)) : undefined,
      statusId: item.status ? statusResult.codeToId.get(normalizeCode(item.status)) : undefined,
      supplierId: item.supplier
        ? supplierResult.codeToId.get(normalizeCode(item.supplier))
        : undefined,
    }));

    // Get existing codes for counting created vs updated
    const normalizedCodes = preparedItems.map((i) => normalizeSkuCode(i.code));
    const existingCodes = await this.repository.findCodesByShopId(shopId, normalizedCodes);

    // Bulk upsert
    await this.repository.bulkUpsertFull(
      tenantId,
      shopId,
      preparedItems.map((item) => ({
        code: normalizeSkuCode(item.code),
        title: item.title,
        title2: item.title2,
        categoryId: item.categoryId,
        groupId: item.groupId,
        statusId: item.statusId,
        supplierId: item.supplierId,
      })),
    );

    const created = preparedItems.filter(
      (i) => !existingCodes.has(normalizeSkuCode(i.code)),
    ).length;
    const updated = preparedItems.length - created;

    return {
      created,
      updated,
      errors,
      categoriesCreated: categoryResult.created,
      groupsCreated: groupResult.created,
      statusesCreated: statusResult.created,
      suppliersCreated: supplierResult.created,
    };
  }

  async exportForShop(shopId: number): Promise<SkuExportItem[]> {
    const skus = await this.repository.exportForShop(shopId);

    return skus.map((sku) => ({
      code: sku.code,
      title: sku.title,
      title2: sku.title2 ?? undefined,
      category: sku.category ?? undefined,
      group: sku.group ?? undefined,
      status: sku.status ?? undefined,
      supplier: sku.supplier ?? undefined,
    }));
  }

  /**
   * Find SKUs by code or create missing ones.
   * Used by SalesHistory import to auto-create SKUs.
   */
  async findOrCreateByCode(
    tenantId: number,
    shopId: number,
    codes: string[],
  ): Promise<{ codeToId: Map<string, number>; created: number }> {
    if (codes.length === 0) {
      return { codeToId: new Map(), created: 0 };
    }

    const normalizedCodes = codes.map((code) => normalizeSkuCode(code));
    return this.repository.findOrCreateByCode(tenantId, shopId, normalizedCodes);
  }
}
