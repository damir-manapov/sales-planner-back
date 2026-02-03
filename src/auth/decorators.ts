import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { AuthenticatedRequest } from './auth.guard.js';

export const ACCESS_LEVEL_KEY = 'accessLevel';

export enum AccessLevel {
  READ = 'read',
  WRITE = 'write',
  NONE = 'none',
}

export const RequireReadAccess = () => SetMetadata(ACCESS_LEVEL_KEY, AccessLevel.READ);
export const RequireWriteAccess = () => SetMetadata(ACCESS_LEVEL_KEY, AccessLevel.WRITE);

export interface ShopContext {
  shopId: number;
  tenantId: number;
}

export const ShopContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ShopContext => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const shopId = Number.parseInt(request.query.shop_id as string, 10);
    const tenantId = Number.parseInt(request.query.tenant_id as string, 10);

    if (Number.isNaN(shopId) || Number.isNaN(tenantId)) {
      throw new Error('shop_id and tenant_id are required as query parameters');
    }

    return { shopId, tenantId };
  },
);
