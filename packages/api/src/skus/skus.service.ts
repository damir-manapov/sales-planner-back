import { Injectable } from '@nestjs/common';
import type { Sku, SkuExportItem, SkuImportResult } from '@sales-planner/shared';
import { BaseEntityService } from '../common/index.js';
import { DatabaseService } from '../database/index.js';
import { normalizeSkuCode, normalizeCode } from '../lib/index.js';
import { CategoriesService } from '../categories/categories.service.js';
import { GroupsService } from '../groups/groups.service.js';
import { StatusesService } from '../statuses/statuses.service.js';
import { SuppliersService } from '../suppliers/suppliers.service.js';
import type { CreateSkuDto, ImportSkuItem, UpdateSkuDto } from './skus.schema.js';
import { ImportSkuItemSchema } from './skus.schema.js';

export type { Sku };

interface PreparedSkuItem extends ImportSkuItem {
  category_id?: number | null;
  group_id?: number | null;
  status_id?: number | null;
  supplier_id?: number | null;
}

@Injectable()
export class SkusService extends BaseEntityService<Sku, CreateSkuDto, UpdateSkuDto, ImportSkuItem> {
  constructor(
    db: DatabaseService,
    private readonly categoriesService: CategoriesService,
    private readonly groupsService: GroupsService,
    private readonly statusesService: StatusesService,
    private readonly suppliersService: SuppliersService,
  ) {
    super(db, 'skus');
  }

  protected normalizeCode(code: string): string {
    return normalizeSkuCode(code);
  }

  protected validateImportItem(item: unknown) {
    return ImportSkuItemSchema.safeParse(item);
  }

  async bulkUpsert(items: unknown[], shopId: number, tenantId: number): Promise<SkuImportResult> {
    const validItems: ImportSkuItem[] = [];
    const errors: string[] = [];

    items.forEach((item, index) => {
      const result = this.validateImportItem(item);

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

    // Auto-create categories, groups, statuses, and suppliers (following sales_history pattern)
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
        : { codeToId: new Map(), created: 0 },
      groupCodes.length > 0
        ? this.groupsService.findOrCreateByCode(groupCodes, shopId, tenantId)
        : { codeToId: new Map(), created: 0 },
      statusCodes.length > 0
        ? this.statusesService.findOrCreateByCode(statusCodes, shopId, tenantId)
        : { codeToId: new Map(), created: 0 },
      supplierCodes.length > 0
        ? this.suppliersService.findOrCreateByCode(supplierCodes, shopId, tenantId)
        : { codeToId: new Map(), created: 0 },
    ]);

    // Map items to include resolved IDs
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

    // Get existing codes for this shop
    const existingCodes = new Set(
      (
        await this.db
          .selectFrom('skus')
          .select('code')
          .where('shop_id', '=', shopId)
          .where(
            'code',
            'in',
            preparedItems.map((i) => this.normalizeCode(i.code)),
          )
          .execute()
      ).map((r: { code: string }) => r.code),
    );

    // Use ON CONFLICT for efficient upsert
    await this.db
      .insertInto('skus')
      .values(
        preparedItems.map((item) => ({
          code: this.normalizeCode(item.code),
          title: item.title,
          shop_id: shopId,
          tenant_id: tenantId,
          category_id: item.category_id,
          group_id: item.group_id,
          status_id: item.status_id,
          supplier_id: item.supplier_id,
          updated_at: new Date(),
        })),
      )
      .onConflict((oc) =>
        oc.columns(['code', 'shop_id']).doUpdateSet((eb) => ({
          title: eb.ref('excluded.title'),
          category_id: eb.ref('excluded.category_id'),
          group_id: eb.ref('excluded.group_id'),
          status_id: eb.ref('excluded.status_id'),
          supplier_id: eb.ref('excluded.supplier_id'),
          updated_at: new Date(),
        })),
      )
      .execute();

    const created = preparedItems.filter(
      (i) => !existingCodes.has(this.normalizeCode(i.code)),
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

  async deleteByShopId(shopId: number): Promise<number> {
    const result = await this.db
      .deleteFrom('skus')
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  async exportForShop(shopId: number): Promise<SkuExportItem[]> {
    const skus = await this.db
      .selectFrom('skus')
      .leftJoin('categories', 'skus.category_id', 'categories.id')
      .leftJoin('groups', 'skus.group_id', 'groups.id')
      .leftJoin('statuses', 'skus.status_id', 'statuses.id')
      .leftJoin('suppliers', 'skus.supplier_id', 'suppliers.id')
      .select([
        'skus.code',
        'skus.title',
        'categories.code as category',
        'groups.code as group',
        'statuses.code as status',
        'suppliers.code as supplier',
      ])
      .where('skus.shop_id', '=', shopId)
      .orderBy('skus.code', 'asc')
      .execute();

    return skus.map((sku) => ({
      code: sku.code,
      title: sku.title,
      category: sku.category ?? undefined,
      group: sku.group ?? undefined,
      status: sku.status ?? undefined,
      supplier: sku.supplier ?? undefined,
    }));
  }

  /**
   * Override the base findOrCreateByCode to use SKU-specific normalization
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
    const uniqueCodes = [...new Set(normalizedCodes)];

    let entities = await this.db
      .selectFrom('skus')
      .select(['id', 'code'])
      .where('shop_id', '=', shopId)
      .where('code', 'in', uniqueCodes)
      .execute();

    const existingCodes = new Set(entities.map((e) => e.code));
    const missingCodes = uniqueCodes.filter((code) => !existingCodes.has(code));

    if (missingCodes.length > 0) {
      const newEntities = await this.db
        .insertInto('skus')
        .values(
          missingCodes.map((code) => ({
            code,
            title: code,
            shop_id: shopId,
            tenant_id: tenantId,
            updated_at: new Date(),
          })),
        )
        .returning(['id', 'code'])
        .execute();

      entities = [...entities, ...newEntities];
    }

    return {
      codeToId: new Map(entities.map((e) => [e.code, e.id])),
      created: missingCodes.length,
    };
  }
}
