import { Injectable } from '@nestjs/common';
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
  category_id?: number | null;
  group_id?: number | null;
  status_id?: number | null;
  supplier_id?: number | null;
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

  // ============ Read Operations (delegate to repository) ============

  async findById(id: number): Promise<Sku | undefined> {
    return this.repository.findById(id);
  }

  async findByShopId(shopId: number): Promise<Sku[]> {
    return this.repository.findByShopId(shopId);
  }

  async findByShopIdPaginated(
    shopId: number,
    query?: PaginationQuery,
  ): Promise<PaginatedResponse<Sku>> {
    return this.repository.findByShopIdPaginated(shopId, query);
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
        code: normalizeSkuCode(dto.code),
        title: dto.title,
        title2: dto.title2,
        shop_id: dto.shop_id,
        tenant_id: dto.tenant_id,
        category_id: dto.category_id,
        group_id: dto.group_id,
        status_id: dto.status_id,
        supplier_id: dto.supplier_id,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException('sku', dto.code, 'this shop');
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateSkuDto): Promise<Sku | undefined> {
    const updateData: Parameters<SkusRepository['update']>[1] = {};

    if (dto.code !== undefined) updateData.code = normalizeSkuCode(dto.code);
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.title2 !== undefined) updateData.title2 = dto.title2;
    if (dto.category_id !== undefined) updateData.category_id = dto.category_id;
    if (dto.group_id !== undefined) updateData.group_id = dto.group_id;
    if (dto.status_id !== undefined) updateData.status_id = dto.status_id;
    if (dto.supplier_id !== undefined) updateData.supplier_id = dto.supplier_id;

    return this.repository.update(id, updateData);
  }

  async delete(id: number): Promise<void> {
    return this.repository.delete(id);
  }

  async deleteByShopId(shopId: number): Promise<number> {
    return this.repository.deleteByShopId(shopId);
  }

  // ============ Import/Export Operations ============

  async bulkUpsert(items: unknown[], shopId: number, tenantId: number): Promise<SkuImportResult> {
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

    if (validItems.length === 0) {
      return {
        created: 0,
        updated: 0,
        errors,
        categories_created: 0,
        groups_created: 0,
        statuses_created: 0,
        suppliers_created: 0,
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
        ? this.categoriesService.findOrCreateByCode(categoryCodes, shopId, tenantId)
        : { codeToId: new Map<string, number>(), created: 0 },
      groupCodes.length > 0
        ? this.groupsService.findOrCreateByCode(groupCodes, shopId, tenantId)
        : { codeToId: new Map<string, number>(), created: 0 },
      statusCodes.length > 0
        ? this.statusesService.findOrCreateByCode(statusCodes, shopId, tenantId)
        : { codeToId: new Map<string, number>(), created: 0 },
      supplierCodes.length > 0
        ? this.suppliersService.findOrCreateByCode(supplierCodes, shopId, tenantId)
        : { codeToId: new Map<string, number>(), created: 0 },
    ]);

    // Prepare items with resolved IDs
    const preparedItems: PreparedSkuItem[] = validItems.map((item) => ({
      ...item,
      category_id: item.category
        ? (categoryResult.codeToId.get(normalizeCode(item.category)) ?? null)
        : null,
      group_id: item.group ? (groupResult.codeToId.get(normalizeCode(item.group)) ?? null) : null,
      status_id: item.status
        ? (statusResult.codeToId.get(normalizeCode(item.status)) ?? null)
        : null,
      supplier_id: item.supplier
        ? (supplierResult.codeToId.get(normalizeCode(item.supplier)) ?? null)
        : null,
    }));

    // Get existing codes for counting created vs updated
    const normalizedCodes = preparedItems.map((i) => normalizeSkuCode(i.code));
    const existingCodes = await this.repository.findCodesByShopId(shopId, normalizedCodes);

    // Bulk upsert
    await this.repository.bulkUpsert(
      preparedItems.map((item) => ({
        code: normalizeSkuCode(item.code),
        title: item.title,
        title2: item.title2,
        shop_id: shopId,
        tenant_id: tenantId,
        category_id: item.category_id,
        group_id: item.group_id,
        status_id: item.status_id,
        supplier_id: item.supplier_id,
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
      categories_created: categoryResult.created,
      groups_created: groupResult.created,
      statuses_created: statusResult.created,
      suppliers_created: supplierResult.created,
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
    codes: string[],
    shopId: number,
    tenantId: number,
  ): Promise<{ codeToId: Map<string, number>; created: number }> {
    if (codes.length === 0) {
      return { codeToId: new Map(), created: 0 };
    }

    const normalizedCodes = codes.map((code) => normalizeSkuCode(code));
    return this.repository.findOrCreateByCode(normalizedCodes, shopId, tenantId);
  }
}
