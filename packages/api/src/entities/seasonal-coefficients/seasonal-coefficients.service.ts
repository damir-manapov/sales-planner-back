import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ImportResult,
  PaginatedResponse,
  SeasonalCoefficient,
  SeasonalCoefficientExportItem,
} from '@sales-planner/shared';
import { DuplicateResourceException, isUniqueViolation } from '../../common/index.js';
import { DatabaseService } from '../../database/index.js';
import { GroupsService } from '../groups/groups.service.js';
import type {
  CreateSeasonalCoefficientDto,
  ImportSeasonalCoefficientItem,
  SeasonalCoefficientQuery,
  UpdateSeasonalCoefficientDto,
} from './seasonal-coefficients.schema.js';
import { ImportSeasonalCoefficientItemSchema } from './seasonal-coefficients.schema.js';

export type { SeasonalCoefficient };

interface PreparedSeasonalCoefficientItem extends ImportSeasonalCoefficientItem {
  group_id: number;
}

@Injectable()
export class SeasonalCoefficientsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly groupsService: GroupsService,
  ) {}

  async findAll(): Promise<SeasonalCoefficient[]> {
    return this.db.selectFrom('seasonal_coefficients').selectAll().execute();
  }

  async findById(id: number): Promise<SeasonalCoefficient | undefined> {
    return this.db
      .selectFrom('seasonal_coefficients')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async findByShopId(shopId: number): Promise<SeasonalCoefficient[]> {
    return this.db
      .selectFrom('seasonal_coefficients')
      .selectAll()
      .where('shop_id', '=', shopId)
      .execute();
  }

  async findByShopIdPaginated(
    shopId: number,
    query?: SeasonalCoefficientQuery,
  ): Promise<PaginatedResponse<SeasonalCoefficient>> {
    const { limit = 100, offset = 0 } = query ?? {};

    const baseQuery = this.db.selectFrom('seasonal_coefficients').where('shop_id', '=', shopId);

    const { count } = await baseQuery
      .select((eb) => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow();

    const items = await baseQuery
      .selectAll()
      .orderBy('group_id', 'asc')
      .orderBy('month', 'asc')
      .limit(limit)
      .offset(offset)
      .execute();

    return { items, total: Number(count), limit, offset };
  }

  async create(dto: CreateSeasonalCoefficientDto): Promise<SeasonalCoefficient> {
    try {
      return await this.db
        .insertInto('seasonal_coefficients')
        .values({
          shop_id: dto.shop_id,
          tenant_id: dto.tenant_id,
          group_id: dto.group_id,
          month: dto.month,
          coefficient: dto.coefficient,
          updated_at: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException(
          'Seasonal Coefficient',
          `group ${dto.group_id} month ${dto.month}`,
          'this shop',
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateSeasonalCoefficientDto): Promise<SeasonalCoefficient> {
    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (dto.coefficient !== undefined) {
      updateData.coefficient = dto.coefficient;
    }

    const result = await this.db
      .updateTable('seasonal_coefficients')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      throw new NotFoundException(`Seasonal coefficient with id ${id} not found`);
    }
    return result;
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('seasonal_coefficients').where('id', '=', id).execute();
  }

  async deleteByShopId(shopId: number): Promise<number> {
    const result = await this.db
      .deleteFrom('seasonal_coefficients')
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  async upsert(dto: CreateSeasonalCoefficientDto): Promise<SeasonalCoefficient> {
    return this.db
      .insertInto('seasonal_coefficients')
      .values({
        shop_id: dto.shop_id,
        tenant_id: dto.tenant_id,
        group_id: dto.group_id,
        month: dto.month,
        coefficient: dto.coefficient,
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['shop_id', 'group_id', 'month']).doUpdateSet({
          coefficient: dto.coefficient,
          updated_at: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async bulkUpsert(
    tenantId: number,
    shopId: number,
    items: ImportSeasonalCoefficientItem[],
  ): Promise<ImportResult> {
    if (items.length === 0) {
      return { created: 0, updated: 0, errors: [] };
    }

    const errors: string[] = [];
    const validatedItems: ImportSeasonalCoefficientItem[] = [];

    items.forEach((item, i) => {
      const result = ImportSeasonalCoefficientItemSchema.safeParse(item);
      if (!result.success) {
        const errorMessages = result.error.issues.map((issue) => issue.message).join(', ');
        errors.push(`Invalid item at index ${i}: ${errorMessages}`);
        return;
      }
      validatedItems.push(result.data);
    });

    if (validatedItems.length === 0) {
      return { created: 0, updated: 0, errors };
    }

    // Find or create groups by code
    const groupCodes = validatedItems.map((i) => this.groupsService.normalizeCode(i.group));
    const { codeToId: groupCodeToId } = await this.groupsService.findOrCreateByCode(
      tenantId,
      shopId,
      groupCodes,
    );

    // Prepare items
    const validItems: PreparedSeasonalCoefficientItem[] = [];
    validatedItems.forEach((item) => {
      const normalizedGroupCode = this.groupsService.normalizeCode(item.group);
      const groupId = groupCodeToId.get(normalizedGroupCode);

      if (!groupId) {
        errors.push(`Group not found: ${item.group}`);
        return;
      }

      validItems.push({
        ...item,
        group_id: groupId,
      });
    });

    if (validItems.length === 0) {
      return { created: 0, updated: 0, errors };
    }

    // Bulk upsert
    const values = validItems.map((item) => ({
      shop_id: shopId,
      tenant_id: tenantId,
      group_id: item.group_id,
      month: item.month,
      coefficient: item.coefficient,
      updated_at: new Date(),
    }));

    await this.db
      .insertInto('seasonal_coefficients')
      .values(values)
      .onConflict((oc) =>
        oc.columns(['shop_id', 'group_id', 'month']).doUpdateSet((eb) => ({
          coefficient: eb.ref('excluded.coefficient'),
          updated_at: new Date(),
        })),
      )
      .execute();

    return { created: validItems.length, updated: 0, errors };
  }

  async exportCsv(shopId: number): Promise<SeasonalCoefficientExportItem[]> {
    const rows = await this.db
      .selectFrom('seasonal_coefficients')
      .innerJoin('groups', 'groups.id', 'seasonal_coefficients.group_id')
      .select([
        'groups.code as group',
        'seasonal_coefficients.month',
        'seasonal_coefficients.coefficient',
      ])
      .where('seasonal_coefficients.shop_id', '=', shopId)
      .orderBy('groups.code', 'asc')
      .orderBy('seasonal_coefficients.month', 'asc')
      .execute();

    return rows.map((row) => ({
      group: row.group,
      month: row.month,
      coefficient: row.coefficient,
    }));
  }
}
