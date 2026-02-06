import { Injectable } from '@nestjs/common';
import type { Marketplace } from '@sales-planner/shared';
import { BaseEntityService } from '../../common/base-entity.service.js';
import { DatabaseService } from '../../database/index.js';
import { normalizeCode as normalizeMarketplaceCode } from '../../lib/index.js';
import type {
  CreateMarketplaceDto,
  ImportMarketplaceItem,
  UpdateMarketplaceDto,
} from './marketplaces.schema.js';
import { ImportMarketplaceItemSchema } from './marketplaces.schema.js';

export type { Marketplace };
export type { CreateMarketplaceDto, UpdateMarketplaceDto };

@Injectable()
export class MarketplacesService extends BaseEntityService<
  Marketplace,
  CreateMarketplaceDto,
  UpdateMarketplaceDto,
  ImportMarketplaceItem
> {
  constructor(db: DatabaseService) {
    super(db, 'marketplaces');
  }

  protected normalizeCode(code: string): string {
    return normalizeMarketplaceCode(code);
  }

  protected validateImportItem(item: unknown) {
    return ImportMarketplaceItemSchema.safeParse(item);
  }

  /**
   * Ensures all given marketplace codes exist for a specific shop, auto-creating missing ones.
   * Returns the count of newly created marketplaces.
   */
  async ensureExist(codes: string[], shopId: number, tenantId: number): Promise<number> {
    if (codes.length === 0) {
      return 0;
    }

    // Normalize all codes first
    const normalizedCodes = codes.map((code) => normalizeMarketplaceCode(code));
    const uniqueCodes = [...new Set(normalizedCodes)];

    const existing = await this.db
      .selectFrom('marketplaces')
      .select('code')
      .where('code', 'in', uniqueCodes)
      .where('shop_id', '=', shopId)
      .execute();

    const existingCodes = new Set(existing.map((m) => m.code));
    const missingCodes = uniqueCodes.filter((code) => !existingCodes.has(code));

    if (missingCodes.length > 0) {
      await this.db
        .insertInto('marketplaces')
        .values(
          missingCodes.map((code) => ({
            code,
            title: code,
            shop_id: shopId,
            tenant_id: tenantId,
            updated_at: new Date(),
          })),
        )
        .execute();
    }

    return missingCodes.length;
  }
}
