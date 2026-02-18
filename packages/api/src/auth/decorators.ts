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
    const query = request.query as Record<string, string | undefined>;
    const shopId = Number.parseInt(query.shopId ?? '', 10);
    const tenantId = Number.parseInt(query.tenantId ?? '', 10);

    if (Number.isNaN(shopId) || Number.isNaN(tenantId)) {
      throw new Error('shopId and tenantId are required as query parameters');
    }

    return { shopId, tenantId };
  },
);
