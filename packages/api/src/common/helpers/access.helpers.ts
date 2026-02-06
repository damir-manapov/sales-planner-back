import { NotFoundException } from '@nestjs/common';
import type { ShopScopedBaseEntity } from '@sales-planner/shared';
import type { ShopContext } from '../../auth/decorators.js';

/**
 * Assert that an entity exists and belongs to the current shop/tenant context.
 * Throws NotFoundException if entity is not found or doesn't belong to the context.
 *
 * @param entity - The entity to check (may be undefined)
 * @param ctx - The shop context with shopId and tenantId
 * @param entityName - Human-readable entity name for error messages (e.g., 'Brand', 'SKU')
 * @param id - The entity ID for error messages
 * @throws NotFoundException if entity is undefined or doesn't belong to context
 */
export function assertShopAccess<T extends ShopScopedBaseEntity>(
  entity: T | undefined,
  ctx: ShopContext,
  entityName: string,
  id: number,
): asserts entity is T {
  if (!entity) {
    throw new NotFoundException(`${entityName} with id ${id} not found`);
  }
  if (entity.shop_id !== ctx.shopId || entity.tenant_id !== ctx.tenantId) {
    throw new NotFoundException(`${entityName} with id ${id} not found in this shop/tenant`);
  }
}
