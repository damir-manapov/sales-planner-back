import { Injectable } from '@nestjs/common';
import { type Insertable, type Selectable } from 'kysely';
import { DuplicateResourceException, isUniqueViolation } from '../common/index.js';
import { DatabaseService } from '../database/database.service.js';
import { type UserShops } from '../database/database.types.js';

export type UserShop = Selectable<UserShops>;
export type CreateUserShopDto = Insertable<UserShops>;

@Injectable()
export class UserShopsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<UserShop[]> {
    return this.db.selectFrom('user_shops').selectAll().execute();
  }

  async findByUserId(userId: number): Promise<UserShop[]> {
    return this.db.selectFrom('user_shops').selectAll().where('user_id', '=', userId).execute();
  }

  async findByShopId(shopId: number): Promise<UserShop[]> {
    return this.db.selectFrom('user_shops').selectAll().where('shop_id', '=', shopId).execute();
  }

  async findByTenantId(tenantId: number): Promise<UserShop[]> {
    return this.db
      .selectFrom('user_shops')
      .selectAll('user_shops')
      .innerJoin('shops', 'shops.id', 'user_shops.shop_id')
      .where('shops.tenant_id', '=', tenantId)
      .execute();
  }

  async findById(id: number): Promise<UserShop | undefined> {
    return this.db.selectFrom('user_shops').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async create(dto: CreateUserShopDto): Promise<UserShop> {
    try {
      return this.db.insertInto('user_shops').values(dto).returningAll().executeTakeFirstOrThrow();
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new DuplicateResourceException(
          'User Shop',
          `User ${dto.user_id} - Shop ${dto.shop_id}`,
        );
      }
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('user_shops').where('id', '=', id).execute();
  }

  async deleteByUserAndShop(userId: number, shopId: number): Promise<void> {
    await this.db
      .deleteFrom('user_shops')
      .where('user_id', '=', userId)
      .where('shop_id', '=', shopId)
      .execute();
  }
}
